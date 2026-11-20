# Lower priority calls to the cluster

Problem. We pay for Modal dev and staging inference while production GPUs sit partly idle by day: decode pools averaged 11% to 36% GPU busy time from 09:00 to 18:00 PT over the measured week. Some evaluation calls could use models already on the clusters, but…

{{dashboard:lower-priority-calls}}

## Details

<details>
<summary>Overview</summary>

<b>Problem.</b> We pay for Modal dev and staging inference while production GPUs sit partly idle by day: <span discussion-urls="discussion://41b4a78a-1c87-8080-b5c2-c23c0a1e7661/41b4a78a-1c87-8036-a87d-cef805ab0f6d/41b4a78a-1c87-804c-91ab-001c70919ac5">decode pools averaged 11% to 36% GPU busy time from 09:00 to 18:00 PT over the measured week</span>. Some evaluation calls could use models already on the clusters, but must not compete equally with customer calls.

<b>Solution.</b> Add explicit lower-priority admission in the inference router for internal work on the same model as production. Production goes first; lower-priority calls wait or fall back to Modal dev. Experimental model candidates stay on their intended endpoints.

<b>Why.</b> It puts capacity we already run to work, with admission rules protecting production. The evidence supports a small pilot worth potentially a few thousand dollars per month: avoiding 25% to 50% of dev B200 billable time grosses about \$2k to \$4k per 30 days.

<details>
<summary>Goals</summary>

- Use spare daytime capacity without growing the fleet, and cut dev Modal GPU hours while Modal dev keeps work moving when clusters are busy.
- Not in scope: different model candidates and hardware or performance experiments. They stay on dev.

</details>

<details>
<summary>Constraints</summary>

- No measurable production regression in admission wait, queueing, model latency, errors or Modal spill.
- Admit only when no production call waits and protected headroom remains. Cap low-priority concurrency and call length; stop new grants when production needs the pool. Priority is not preemption: running GPU work competes until it finishes.
- Keep production fallback and direct reserves. Low-priority work must not use prod Modal fallback or inflate its autoscaling; it gets its own dev fallback budget and a kill switch.
- Require matching weights, prompt and processor, and serving contract. Respect region and replay pins.

</details>

<details>
<summary>Design</summary>

<b>In one line.</b> Low calls fill free cluster slots up to a per-cluster limit. The capacity controller raises the limit by 1 each second while there is room, and halves it each second while low calls keep a production call on Modal or in line. A low call waits for a slot until its workload's deadline, and only then falls back to dev Modal.

<b>Terms.</b> A slot is one call a cluster can run at a time; a cluster has <code>cap</code> slots. A lease is the router's hold on one slot for one call.

</details>

<details>
<summary>How a low call gets in (router)</summary>

1. The caller asks <code>/admit</code> with <code>priority: low</code>.
2. <span discussion-urls="discussion://41b4a78a-1c87-8080-b5c2-c23c0a1e7661/41c4a78a-1c87-8126-8ed9-e903b4010800/41c4a78a-1c87-8008-9004-001c26f0f96e">The router looks for an owned cluster (tier 1, up) with a free slot and fewer low leases than its limit. </span>If two qualify, it takes the one with more free share.
3. Found: the call gets a lease, counted against the cap like a production lease, so production and the controller both see the slot as taken.
4. <span discussion-urls="discussion://41b4a78a-1c87-8080-b5c2-c23c0a1e7661/41c4a78a-1c87-8167-8186-cf6a9620221a/41c4a78a-1c87-80a1-af43-001cd02e5022,discussion://41b4a78a-1c87-8080-b5c2-c23c0a1e7661/41c4a78a-1c87-8167-8186-cf6a9620221a/41c4a78a-1c87-806f-8826-001c7a301e75">Not found: </span><span discussion-urls="discussion://41b4a78a-1c87-8080-b5c2-c23c0a1e7661/41c4a78a-1c87-8167-8186-cf6a9620221a/41c4a78a-1c87-80a1-af43-001cd02e5022,discussion://41b4a78a-1c87-8080-b5c2-c23c0a1e7661/41c4a78a-1c87-8167-8186-cf6a9620221a/41c4a78a-1c87-806f-8826-001c7a301e75"><code>429 low_refused</code></span><span discussion-urls="discussion://41b4a78a-1c87-8080-b5c2-c23c0a1e7661/41c4a78a-1c87-8167-8186-cf6a9620221a/41c4a78a-1c87-80a1-af43-001cd02e5022,discussion://41b4a78a-1c87-8080-b5c2-c23c0a1e7661/41c4a78a-1c87-8167-8186-cf6a9620221a/41c4a78a-1c87-806f-8826-001c7a301e75"> at once. The caller retries or uses dev Modal. A low call never waits in the router and never goes to production Modal.</span>

Production only waits when every cluster is full, and then a low call finds no free slot anyway. One edge: a slot that frees with no release (an expired lease, a raised cap) goes to the waiting production calls first, and the low call is refused while one still waits.

</details>

<details>
<summary>How long a low call waits (caller)</summary>

- A refused low call keeps asking until its wait cap: the workload's own deadline, not the API's 120 s page deadline.
- For autoeval the cap can be hours: no one waits on the page and the API is not involved.
- A waiting call holds no slot, so it costs production nothing. Dev Modal is the last resort, after the cap.

</details>

<details>
<summary>How the limit moves (capacity controller, every second, per cluster)</summary>

- <b>Up by 1</b> when low leases fill the limit and the cluster still has a free slot.
- <b>Halved each second</b> while the cluster is full, holds low leases, and production has any call on Modal or in line. That production call is there for a slot a low call holds; we call this a displacement.
- <b>Unchanged</b> otherwise. The limit starts at 0 and never passes the cap.

</details>

<details>
<summary>Worked example: one cluster, cap 100</summary>

| Second | Production leases | Low leases | Free slots | Production on Modal | Limit after |
| --- | --- | --- | --- | --- | --- |
| 0 | 40 | 10 (at the limit) | 50 | 0 | 10 → 11 |
| 20 | 40 | 30 (at the limit) | 30 | 0 | 30 → 31 |
| 21, burst | 70 | 30 | 0 | 5, up from 0 | 31 → 15 |
| 22 to 25 | 70 | 30 | 0 | 5 | 15 → 7 → 3 → 1 → 0 |
| 26 to 60 | 70 rising to 75 | 30 falling | 0, then some | 5 falling to 0 | 0, then up by 1 a second |
| after the burst | 40 | at the limit | 45 or more | 0 | up by 1 a second |

- Second 21: the cluster is full with 30 low leases and 5 production calls go to Modal, so the limit halves to 15.
- Seconds 22 to 25: production is still on Modal and the cluster still full, so the limit halves each second, down to 0. No new low call gets in.
- Nothing is cancelled. The 30 low calls finish on their own, and each slot they free goes to production, which leaves Modal.
- With Modal empty and a slot free, the limit climbs by 1 a second again. Low calls refused since second 21 keep asking, and get in once fewer low calls run than the limit. Only a call that reaches its cap runs on dev Modal.

</details>

<details>
<summary>What a burst costs</summary>

- <b>No production call fails</b> because of low calls. The cost is production calls that run on Modal instead of the cluster, or wait in line when Modal is down or full.
- One burst sends at most "limit" production calls to Modal, each for at most one low call's length: up to 120 s (the worker's page deadline). The v4c calls ran 62 to 63 s at hourly p99 on dev Modal; we have no cluster timing for them yet.

</details>

<details>
<summary>Off switch and fail-safes</summary>

- <b>Off switch.</b> <code>server.low_priority.enabled</code> in the router config, false by default. Off, every low admit is refused.
- <b>Controller stops.</b> The limit key expires after 5 s, and no key means a limit of 0, so low admission stops by itself.
- <b>Older router pod.</b> It answers a low admit 400, so it never hands out a production lease by mistake.
- <b>No endless wait.</b> In all three cases low calls get no slot and run on dev Modal by their wait cap.

</details>

<details>
<summary>Metrics</summary>

- <code>controller.low_limit</code>, per cluster: the current limit.
- <code>controller.low_displaced</code>, per namespace: production calls sent to Modal for a slot a low call held. Each second it counts the rise in production's Modal leases, capped at the low leases on full clusters.
- <code>low_wait_expired</code>, counted by the caller: low calls that hit their wait cap and ran on dev Modal. A high count means the clusters have little room for low work.
- Displaced calls times the Modal cost per page is the feature's whole production cost. Compare it with the dev Modal spend the low calls save.

</details>

<details>
<summary>How often production waits (last week)</summary>

Datadog <code>router.queue.length</code>, prod US, Nov 10 to Nov 17, 5-minute windows. A window counts if a production call waited at any point in it.

| Model | All hours | 09:00 to 18:00 PT | By day | Longest line |
| --- | --- | --- | --- | --- |
| R-1 | 17% | 21% | 2% to 38% | 12,088 |
| R-1 mini | 11% | 14% | 1% to 20% | 1,759 |

In those windows the clusters and Modal are all full, so low calls get nothing. In the other 4 of 5 daytime windows they can run.

</details>

<details>
<summary>Where the idea comes from</summary>

Systems that give spare capacity to low work without killing it use feedback, not a fixed share:

- [Heracles (Google)](https://research.google/pubs/heracles-improving-resource-efficiency-at-scale/): grows best-effort work while the latency-critical job has slack, cuts it when slack drops.
- [LEDBAT, RFC 6817](https://www.rfc-editor.org/rfc/rfc6817): background traffic takes spare bandwidth and backs off on a congestion signal.
- [Harvest VMs (Azure)](https://www.usenix.org/conference/osdi20/presentation/ambati): low work grows and shrinks with the host's idle cores.
- [Google SRE, "Handling Overload"](https://sre.google/sre-book/handling-overload/) and [OpenAI Flex](https://platform.openai.com/docs/guides/flex-processing): low requests are refused, not queued, when capacity is short.
- Borg and spot VMs also reclaim idle capacity, but by killing low work, which we ruled out.

</details>

<details>
<summary>All 13 sources of the research note</summary>

1. Borg: [Verma et al., EuroSys 2015](https://research.google/pubs/large-scale-cluster-management-at-google-with-borg/); Tirmazi et al., "Borg: the Next Generation", EuroSys 2020.
2. Heracles: [Lo et al., ISCA 2015](https://research.google/pubs/heracles-improving-resource-efficiency-at-scale/).
3. Harvest VMs: [Ambati et al., OSDI 2020](https://www.usenix.org/conference/osdi20/presentation/ambati).
4. History-based harvesting: [Zhang et al., OSDI 2016](https://www.usenix.org/conference/osdi16/technical-sessions/presentation/zhang-yunqi).
5. Scavenger traffic: [RFC 6817 LEDBAT](https://www.rfc-editor.org/rfc/rfc6817); [RFC 8622 Lower-Effort PHB](https://www.rfc-editor.org/rfc/rfc8622); Kuzmanovic and Knightly, "TCP-LP", INFOCOM 2003.
6. Non-preemptive priority queues: Cobham, Operations Research 1954; Kleinrock, Queueing Systems Vol. 2, ch. 3.
7. Spot VMs: [AWS EC2 Spot interruptions](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/spot-interruptions.html); [GCP Spot VMs](https://cloud.google.com/compute/docs/instances/spot).
8. [Google SRE book, "Handling Overload"](https://sre.google/sre-book/handling-overload/).
9. [Kubernetes Gateway API Inference Extension](https://gateway-api-inference-extension.sigs.k8s.io/) (criticality, Sheddable).
10. OpenAI [Flex processing](https://platform.openai.com/docs/guides/flex-processing) and [Batch API](https://platform.openai.com/docs/guides/batch).
11. [vLLM priority scheduling](https://docs.vllm.ai/en/latest/).
12. Llumnix: [Sun et al., OSDI 2024](https://www.usenix.org/conference/osdi24/presentation/sun-biao).
13. [Kubernetes non-preempting PriorityClass](https://kubernetes.io/docs/concepts/scheduling-eviction/pod-priority-preemption/#non-preempting-priority-class).

</details>

<details>
<summary>Feasibility and Impact</summary>

</details>

<details>
<summary>There is headroom, not a guaranteed spare budget</summary>

Datadog GPU busy time, 09:00 to 18:00 PT, over the measured week:

| Decode pool | use1 mean / p95 | uss1 mean / p95 |
| --- | --- | --- |
| R-1 35B | 36% / 71% | 36% / 72% |
| R-1 mini | 11% / 51% | 14% / 57% |
| Maverick | 32% / 64% | 33% / 66% |

<p>
R-1 router leases averaged about 9.5% of configured cap on use1 and uss1 over the full week, against about 28% GPU busy time. Free seats are not idle compute; direct calls and bursts also use the GPUs. 
</p>

</details>

<details>
<summary>Start with a narrow spend envelope</summary>

Same week. Bills include all resources; calls are Modal invocations, not unique jobs or pages.

| App | Calls | Weekly bill | Scope |
| --- | --- | --- | --- |
| dev fpp-flash, R1 + R1Mini | 478k | \$2,689 | Includes candidate and performance work; eligibility unknown |
| stg fpp-flash, R1 + R1Mini | 290k | \$3,001 | Wider follow-up, not immediate savings |
| stg agentic-model-flash-vllm | 610k | \$2,535 | Wider follow-up, not immediate savings |

Do not sum these bills as savings: candidate models, warm floors and staging validation may be ineligible.

The first case is dev fpp-flash on B200, which billed \$1,864 (B300 billed \$507 and is excluded as experiments).

| B200 billable time avoided | Gross per 30 days |
| --- | --- |
| 25% | about \$2k |
| 50% | about \$4k |
| 100% | \$8k ceiling |

These are conditional scenarios, not call share targets. Gross savings are zero if paid dev capacity stays warm. Net savings also subtract extra cluster and transfer cost and any production Modal spill.

Size check: the 469k dev R-1 calls averaged 0.78/s; production R-1 cluster upstreams handled 155/s in a 2026-11-16 (PT) sample. Mixes differ, but this workload alone will not lift fleet utilization much.

</details>

<details>
<summary>Router reuse is plausible; priority is missing</summary>

Production R-1 already uses the router. A dev Maverick trace on 2026-11-17 12:40 PT (PT) reached gcp\_use1 through it with 1 ms admission wait (not a low-priority test).

Admission is FIFO within a namespace, with no priority field, so enabling routing or adding a namespace does not protect a shared pool. Priority needs shared capacity accounting, dev fallback and preserved replay pins.

Many dev autoeval calls test different model candidates, which prod would invalidate. In <code>r1_served_v_dev</code>, the baseline reuses captured production output, so there is no baseline call to save. We must find truly replaceable same-model calls before promising savings.

</details>

<details>
<summary>Metrics</summary>

| Measure | Compare by model, pool and priority |
| --- | --- |
| Production safety | p95 and p99 admit wait, queue depth, latency, timeouts, errors, Modal spill |
| Useful extra work | Eligible calls completed, cluster share, queue wait, deadlines, retries |
| Utilization | Daytime GPU busy time, leases against cap, engine queued and inflight work |
| Real savings | Dev Modal GPU hours and dollars at matched volume, warm runners, extra cluster cost, prod Modal spill |

Success means positive net savings and more useful cluster work, with production inside agreed guardrails. No rollout threshold is validated yet.

</details>

<details>
<summary>Questions</summary>

- Which dev calls really match production rather than evaluate a different model?
- Priority inside one namespace, or a separate queue sharing the capacity budget?
- What headroom and maximum call length let production recover quickly?
- How long may work wait before dev fallback, and are retries acceptable?
- Can paid dev GPU hours fall, or do warm floors absorb the saving?

</details>

<details>
<summary>Evidence</summary>

- Window: 2026-11-09 (PT), the bounds of the Modal command below.
- GPU busy time: [Inference router dashboard](https://us3.datadoghq.com/dashboard/jhy-7wx-adw/inference-router), <code>avg:DCGM_FI_DEV_GPU_UTIL{*} by {cluster_name,pod}.rollup(avg,300)</code> on fpp-35b, fpp-2b and maverick Dynamo decode pods; equal mean across pods per point, then mean and p95 of daytime points. usw3 excluded for partial coverage. Not throughput or safe headroom.
- Leases: <code>max:controller.cap{env:prod,!cluster:modal} by {namespace,cluster}.rollup(avg,300)</code> and <code>controller.live_leases</code>, leader samples only. fpp-35b occupancy: 9.58% use1, 9.46% uss1. Direct calls may lack router leases.
- Billing: <code>modal billing report --start 2026-11-10 --end 2026-11-17 --show-resources --json</code>, summed by environment, app and resource. Dev fpp B200 \$1,864.41645292, or \$7,990.356 over 30 days. One week, not a run rate: daily B200 ranged \$92 to \$736.
- Calls: Tinybird <code>modal_function_calls</code>, same bounds. Dev fpp R1 469,079, R1Mini 8,735; stg fpp R1 274,786, R1Mini 15,463; stg agentic 610,176. Not GPU hours, eligible volume or per call savings.
- Production size: Tinybird <code>otel_traces</code>, <code>inference-router</code> <code>router.upstream</code>, prod fpp-35b gcp\_\* targets, 2026-11-16 (PT): 558,401 upstreams. A size comparison, not a throughput test.
- Dev trace: 2026-11-17 12:40 PT (PT), <code>model.call</code>, dev, maverick, dynamo, gcp\_use1, via\_router=true, admit\_wait\_ms=1.
- Code: [admission queue](https://github.com/reductoai/api/blob/389e8166c9cdc43445321528233ca28b8b6e0df0/inference-router/internal/admission/lua/admit.lua), [admit request](https://github.com/reductoai/api/blob/389e8166c9cdc43445321528233ca28b8b6e0df0/inference-router/internal/proxy/admit.go), [replay gate](https://github.com/reductoai/api/blob/389e8166c9cdc43445321528233ca28b8b6e0df0/src/lms/inference_router/gate.py), [served vs dev](https://github.com/reductoai/api/blob/389e8166c9cdc43445321528233ca28b8b6e0df0/src/autoeval_replay/domains/full_page_parse/experiments/r1_served_v_dev.py).

</details>

---

</details>

<details>
<summary>Execution</summary>



</details>

<details>
<summary>Plan</summary>

1. PR: wire in the v4c shadow R-1 re-parse as opt-in. Pilot against a matched 09:00 to 18:00 PT baseline including a peak; compare net cost and production latency before expanding.
   - The caller retries a low <code>/admit</code> until the workload's deadline (hours for autoeval, not the 120 s page deadline), then uses dev Modal and counts <code>low_wait_expired</code>. No router queue.
   - On hold: Jean closed the v4c routing work for now (Nov 19). Start only when he brings it back.
   - Needs the merged router and controller build on every pod first (ships with the all-region GPU promote of main <code>8122ce7</code>); both switches stay off until the pilot.
2. PR: a second line in the router, where low calls wait instead of getting <code>429 low_refused</code>. Waits on Jean's stamp.
   - A freed slot goes to the production line first, then to the low line, under the controller's limit.
   - The low line never counts toward Modal or cluster scaling, so low work still never starts a Modal container.
   - If it ships before step 1, it replaces step 1's caller retry loop: calls keep their order and the line is one number to watch. Dev Modal after the workload's deadline stays.
   - Verify on staging: with the low line full, production wait and p99 do not move.

</details>

<details>
<summary>Logs</summary>

- 2026-11-17 12:49 PT (PT): Measured spend, GPU utilization and lease occupancy; checked traces and admission semantics. Exploration only; no traffic or code changed.
- 2026-11-17 13:10 PT (PT): Workload picked: the R-1 re-parse of the v4c Deep Extract shadow. Same weights as prod R-1 (<code>fpp_35b_0912</code>), batch priority, already has a kill switch (the arm percents).
  - Volume, Nov 12 to 16 (the 5 days with traces): 210k calls, 85% of dev R-1 calls. 15k to 97k a day; peak hour 14.6k calls (about 4/s).
  - Dev R-1 bill, Nov 9 to 15: \$2,702, \$80 to \$795 a day. It does not follow call count, so the saving depends on dev R-1 scaling down once these calls move.
  - Enough volume to build.
- 2026-11-17 13:30 PT (PT): Admission PR open: [#15178](https://github.com/reductoai/api/pull/15178). New <code>/admit-low</code> route, off until a cluster sets <code>low_priority_slots</code>.
  - Low leases share the cluster cap, never queue, never reach Modal, and do not count toward Modal sizing.
  - Defaults: 50% headroom, 120 s call limit (raised from 60 s on Jean's review: 120 s is the worker's page deadline, so the router does not cut a call the worker still waits for). Burst and drain tested on a local Valkey cluster.
  - Review fixes: a low call cut at the limit does not count toward the breaker; <code>/admit-low</code> has its own counter, so the admit monitors see only production.
  - CI green, Devin Review and Codex comments closed. One existing router test failed once and passed on rerun; cause not confirmed.
- 2026-11-17 15:50 PT (PT): #15178 reworked on Jean's review: no <code>/admit-low</code>; <code>/admit</code> takes <code>priority</code> (absent or <code>normal</code> = production, unchanged; <code>low</code> = the same immediate grant or refusal).
  - A low admit carries no <code>timeout_ms</code>, so a pod of an older build answers it 400 and gives no production lease.
  - CI green, Devin Review closed; Codex re-review requested.
- 2026-11-17 17:10 PT (PT): #15178 review rounds done, CI green. Low calls carry <code>priority:low</code>, and five production monitors (router errors x2, Modal share x2, lease\_unknown) filter it out. A low call ended by <code>max_call</code> is not recorded in the cluster's error window.
- 2026-11-17 18:15 PT (PT): Jean's review of #15178 rejected per-cluster slots, a fixed headroom share and preemption. Wrote the new design above: a per-cluster limit the capacity controller tunes by feedback. Waiting on his reaction before building more.
  - Checked first: how often production waits (table above).
- 2026-11-17 21:25 PT (PT): Jean's comment: a low call could wait without end. He set the wait cap to the workload's own deadline, hours for autoeval; after it the call runs on dev Modal, counted by <code>low_wait_expired</code>.
- 2026-11-18 11:39 PT (PT): Jean's two comments: no low lease limit, and a call with no slot just waits. Rewrote the design around any free owned-cluster slot, a low line in the router, and a pause on low grants while production waits or runs on Modal. Dropped the self-tuning limit and the controller change. Waiting on his stamp.
  - Room: production used 112 of about 1,000 owned-cluster slots on weekday daytime average, and was on Modal 5% to 12% of the daytime.
- 2026-11-18 12:39 PT (PT): Jean asked to go back to the previous design and start: the self-tuning limit, a refused call retrying until its workload's deadline, then dev Modal. Design above restored; building it on #15178.
- 2026-11-18 12:55 PT (PT): Pushed the stamped design to #15178: the router admits a low call under the controller's limit, and the controller moves the limit each second and reports <code>controller.low_limit</code> and <code>controller.low_displaced</code>. Off by default; nothing deployed.
- 2026-11-18 13:19 PT (PT): Jean picked "halve every second": the limit halves each second while a full cluster holds low leases and production has any call on Modal, not only when Modal use rises. Built into #15178; the design above says so.
- 2026-11-18 13:42 PT (PT): #15178 review fixes: waiting production calls get free slots before a low admit (Codex); low leases count in O(1) (Codex); a halved limit never passes the cap. CI green before the last push.
- 2026-11-18 14:50 PT (PT): #15178 more review fixes (Codex): the limit also halves while production waits in line (Modal down or full; Jean's pick covers it); the controller sweeps expired low leases, 100 a call; the Redis key schema golden has the two new keys; the added-latency monitor leaves out low calls.
- 2026-11-19 02:36 PT (PT): [#15178](https://github.com/reductoai/api/pull/15178) ✅ merged (Jean approved). Last changes: merged <code>main</code> (cross-region clusters; low calls stay on tier 1), and the limit grows only when the low count equals it. Not deployed; both switches off.
- 2026-11-19 13:25 PT (PT): Measured for Jean's push-pull question, prod US, Nov 12 to 19 (<a href="https://app.notion.com/p/41d4a78a1c8781edbc45c68e5d3a0a29">Push-pull inference across clusters and Modal: findings</a>). Cluster seats in use on average: R-1 4.8%, R-1 mini 3.2%, Maverick 5.8%, full at peaks. Production calls that waited in line: 7.8%, 3.8%, 3.4%. Getting a seat when one is free takes 1.1 to 3.8 ms. No code or traffic changed.

</details>

<details>
<summary>Impact</summary>

- Cluster utilization and p99 latency of priority calls: not measured yet; measure before vs after once it ships.

</details>

