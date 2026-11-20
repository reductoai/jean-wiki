---
{"title": "Workstreams", "url": "https://app.notion.com/p/41c4a78a1c8781b189d1ff1ff6626677", "id": "41c4a78a1c8781b189d1ff1ff6626677", "lastEdited": "2026-11-20T02:48:42.533Z"}
---
One-offs stay on @Today.

Sorted by priority (p0, then p1, then p2), then Inbox order: blocks with asks first, numbers are ask ranks; then running work; then yours. Updated in place. Last update: 18:47 PT.

## Needs you (by priority, then Inbox order)

### \[p0\] More apps on the inference router

- Goal: every Modal app on the router, Modal floors at 1, each cheaper per call.
- Status: needs you:
  - (1) stamp the AU H100 plan for R-1 and R-1 mini ([section](https://app.notion.com/p/4164a78a1c87818ea15bdef76227228c)).
  - (2) stamp the inference router <code>AGENTS.md</code> from Jensen (6 capabilities, 22 invariants).
  - (3) merge the chicken router move [#15451](https://github.com/reductoai/api/pull/15451) (clean).
  - (4) re-run the failed AU job ([run](https://github.com/reductoai/api/actions/runs/44627380051)): the AU leg of today's prod release lost a 2-minute race with the Scalr apply.
  - (5) merge AU R-1 mini router PR 2 [#15428](https://github.com/reductoai/api/pull/15428).
  - (6) merge the AU router downsizing [#15461](https://github.com/reductoai/api/pull/15461) (clean; 89 to 22 USD a day).
  - (7) merge [#15464](https://github.com/reductoai/api/pull/15464): drops an unused confidence warm H100 in US and EU (about 177 USD a day, 0 calls in 7 days).
  - AU R-1 mini router: au-prod router installed, flag created at 0.
  - Extract confidence: v3 [#15468](https://github.com/reductoai/api/pull/15468) open at share 0, CI and reviews running; v1/v2 waits on chicken [#15451](https://github.com/reductoai/api/pull/15451).
  - Ordering PR [#15477](https://github.com/reductoai/api/pull/15477) open at share 0, CI running.
  - Layout needs an HTTP route first; its step (replay first) is going onto the [More apps plan](https://app.notion.com/p/4164a78a1c87818ea15bdef76227228c) for your stamp.
  - Jensen is measuring a real day of FigSum and EU core CV now that both are live.
  - EU Triton at 100% since 01:35 PT with 0.009% fallbacks; EU spend +32% on +54% traffic.
  - The counter fix image is on both staging routers; the EU prod router gets it with the prod release.
  - Fallback baseline (08:32 to 09:32 PT): Datadog shows 716 EU table\_ensemble fallbacks vs 19 real.
- Done: Live in prod US and EU with the 14:29 PT Nov 19 prod release: FigSum [#15418](https://github.com/reductoai/api/pull/15418), EU core CV [#15426](https://github.com/reductoai/api/pull/15426). AU R-1 mini router PR 1 [#15424](https://github.com/reductoai/api/pull/15424) ✅ (\~14:20 PT Nov 19; prod-au eks-addons applied). Push-pull edits stamped ("Apps still off the router"). EU core CV warm-container fix [#15426](https://github.com/reductoai/api/pull/15426) ✅ (\~13:45 PT Nov 19; replay: 8.2 to 3.7 ready containers). In prod, 3,548 dropped pages in 16 Modal spills were all aborted since the cancel-on-disconnect fix shipped. AU R-1 mini router plan stamped (3 PRs; 0 to 80 USD a day on a 234 USD a day AU bill). FigSum warm-container fix [#15418](https://github.com/reductoai/api/pull/15418) ✅ (\~09:42 PT Nov 19; replay: 16% fewer container hours US, 21% EU, about 345 USD a day). Fallback counter fix [#15392](https://github.com/reductoai/api/pull/15392) ✅ (\~09:40 PT Nov 19; Datadog had overcounted table\_ensemble fallbacks about 50x). Citation 7b [#14888](https://github.com/reductoai/api/pull/14888) ✅ + Deploy, US at 100%, no fallbacks. FigSum spare container fix [#15336](https://github.com/reductoai/api/pull/15336) ✅, prod release pending. Fallback error tag [#15355](https://github.com/reductoai/api/pull/15355) ✅. EU Triton at 100%.
- Impact: per 1k before vs after (through Nov 18): R-1 3.73 → 2.21 USD per 1k pages, Magpie 14.54 → 7.10, four more apps cheaper; regressions: FigSum 1.09 → 1.50, Citation 7B EU \~200 → 514 USD a day (Jensen fixing); change tracking 1.41 → 3.59 is volume-driven.; R-1 autoscaler (06:00 to 10:00 PT): no improvement on a non-clean day, full day after 14:15 PT.; FigSum spare container ([#15336](https://github.com/reductoai/api/pull/15336), 06\:00-14\:00 PT): calls waiting over 5 s 4.88% → 1.03% US and 5.58% → 2.00% EU (Nov 18 → Nov 19), EU admit-deadline fallbacks 2,188 → 1, for about 131 USD a day more than the cron. [Details](https://app.notion.com/p/4164a78a1c87818ea15bdef76227228c)
- Left: EU Triton slots; FigSum seat-wait measurement, then slots; AU R-1 mini route; remove ramp flags; AU R-1 mini router PRs 2 and 3.
- Owner: Xavier (Jensen checks cost per call daily) · <mention url="https://app.notion.com/p/4164a78a1c87818ea15bdef76227228c">More apps on the inference router (Modal floors to 1)</mention>

### \[p0\] Routed R-1 mini to prod

- Goal: turn on routing for auto\_route pages in prod, route head at threshold 0.58.
- Status: needs you:
  - (8) stamp step 4: the waiting limit fix (2 to 6).
  - (9) merge the R-1 Dynamo runtime move [#15466](https://github.com/reductoai/api/pull/15466) (R-1 and R-1 mini heads on the new Dynamo runtimes; clean, judge net +4); then the rollout runs on all three US clusters together.
  - R-1 autoscaler: uss1 did scale (burst pool), GPUs full at 32/32; the 411 direct Modal calls are 529 fallbacks from burst workers. The cause of the uneven load is being investigated.
  - (10) low priority: fix the trust policy on AWS role <code>github-dynamo-stable-ecr-build</code> (it rejects the build workflow from main and release branches).
  - Jensen is confirming the routed Modal pick ([#15367](https://github.com/reductoai/api/pull/15367)) is live; it covers US and EU, and AU stays on its old pick by design.
  - The R-1 mini runtime from dynamo-stable #64 is built and pushed from Jensen's VM; image tests and scan next, then the R-1 build; nothing deployed yet.
  - The R-1 runtime is rebuilding after dynamo-stable #66.
  - Then R-1 and R-1 mini roll first, all regions together; then Maverick, fpp-4b and magpie after their own checks.
  - B200 pod split explained: torch.compile (Inductor) generates different kernels per pod; with Inductor off all 24 pods match.
  - Mary is testing a compile cache baked into the image (full speed); fallback is eager at 0.30 vs 0.25 s/page at C1.
  - The cluster PR is held until one is proven.
  - The routed shadow leg is no longer kept warm, so some submits miss it; the daily curve refresh continues.
  - Jensen is rebuilding the R-1 runtime and rolling it out to all regions.
- Done: Routed Modal pick [#15367](https://github.com/reductoai/api/pull/15367) ✅. Routed pick live in prod US and EU with the 14:29 PT Nov 19 prod release (AU stays on its old pick by design). R-1 runtime pip pin [dynamo-stable#66](https://github.com/reductoai/dynamo-stable/pull/66) ✅ (certifi CVE cleared, \~13:43 PT Nov 19). fpp-flash deployed to all regions. [dynamo-stable#63](https://github.com/reductoai/dynamo-stable/pull/63) ✅, [#64](https://github.com/reductoai/dynamo-stable/pull/64) ✅ (pass-through), [#65](https://github.com/reductoai/dynamo-stable/pull/65) ✅ (registration retry backport), \~09:33 PT Nov 19. [promotion plan](https://app.notion.com/p/41a4a78a1c8780be9c83d3f02a810d07) stamped; shadow finished (see Done below); PR 1 [#15367](https://github.com/reductoai/api/pull/15367) built, CI green.
- Impact: shadow, Nov 19 threshold curve (597 judged pages): R-1 mini 9.32, routed at 0.58 9.48 with 19% to R-1, R-1 9.53; PR 1 gates: 30.45 vs 30.24 pages/s at 128 in flight, 2,000/2,000 identical; prod cost not measured yet. [Details](https://app.notion.com/p/41a4a78a1c8780be9c83d3f02a810d07)
- Left: 2 PRs: route head on cluster fpp-2b, auto\_route through the router.
- Owner: Xavier · <mention url="https://app.notion.com/p/41a4a78a1c8780be9c83d3f02a810d07">@Monday.R-1 routing in shadow</mention>

### \[p0\] Snapshotting on the cluster

- Goal: fpp-35b workers on uss1 restore in \~10 s, not a 3 to 17 min cold start.
- Status: needs you:
  - (11) create the private reductoai/snapshot fork repo.
  - Promote landed 10:56 PT: all four clusters on main 6349ee1, no rollback.
  - NATS-off rolled back on uss1: an old fpp-35b burst worker crashlooped without NATS (uss1 is Ready); usw1 passed; use1 and usw3 untouched.
  - NATS-off: step 1 merged; its rollout holds until you approve the 409 Scalr apply. The NATS removal PR follows once no pod has NATS\_SERVER.
- Done: NATS-off step 1 [#15453](https://github.com/reductoai/api/pull/15453) ✅ (stop injecting NATS\_SERVER, \~14:32 PT Nov 19). NATS off [#15415](https://github.com/reductoai/api/pull/15415) ✅ (\~13:24 PT Nov 19). uss1 reuse trial (Nov 19): fpp-35b burst pods restore in 1.6 to 1.7 min (vs 19 min capture, 5 to 6 min cold); fpp-35b Modal share 0.7 to 0.8% (20 min of data). Promote stall fix [#15420](https://github.com/reductoai/api/pull/15420) ✅ (\~09:46 PT Nov 19; burst graphs no longer stall a promote). live on uss1: \~24 s restore from node SSD. Checkpoint grace 30 to 60 min [#15374](https://github.com/reductoai/api/pull/15374) ✅ merged. Checkpoint reuse [#15398](https://github.com/reductoai/api/pull/15398) ✅; on for fpp-35b on uss1 [#15409](https://github.com/reductoai/api/pull/15409) ✅. 4-cluster promote landed 09:00 PT: all four clusters on 8122ce7, no rollback; pending GPU pods 0 → 3 on use1 (burst waiting for GPUs, by design), 0 on uss1 and usw3.
- Impact: fpp-35b burst restore 5 to 6 min cold → 1.6 to 1.7 min on uss1; fpp-35b Modal share 21% → 2.3% fleet-wide, 0.7 to 0.8% on uss1 trial. [Details](https://app.notion.com/p/41a4a78a1c8780f09346e07d418df2ee)
- Left: uss1 reuse trial; faster capture, then CRIU lazy pages; other models and clusters.
- Owner: Xavier · <mention url="https://app.notion.com/p/41a4a78a1c8780f09346e07d418df2ee">@Monday.Snapshotting on the cluster</mention>

### \[p1\] Inference footguns

- Goal: fix inference bugs that waste GPUs.
- Status: needs you: (12) approve the 409 alert floor apply in Scalr; (13) stamp the R-1 mini Modal split; (14) low priority: run the manual Tinybird deploy. Router 409 alert floor: Jensen is checking the apply and the monitor graphs. R-1 mini Modal split plan v2 covers every Modal server behind the router (N = ceil(floor / containers per server)); waits on your stamp.
- Done: 409 alert floor [#15449](https://github.com/reductoai/api/pull/15449) ✅ (\~14:35 PT Nov 19). Router 409 alert floor stamped (keep 1% over 10 min, floor of 200 409s). Timeout counting fix [#15423](https://github.com/reductoai/api/pull/15423) ✅ (\~13:50 PT Nov 19). router share defaults ✅.
- Impact: not measured yet: utilization. [Details](https://app.notion.com/p/41b4a78a1c8781e88b9eedaaf8354377)
- Left: autoscaler queue signal (KEDA ignores router queue), then 6 more findings.
- Owner: Jensen · <mention url="https://app.notion.com/p/41b4a78a1c8781e88b9eedaaf8354377">Inference footguns</mention> · Sub-page: [R-1 mini Modal split](https://app.notion.com/p/41d4a78a1c87818182cbf2c3fea40d32)

### \[p1\] Cluster-first decorator

- Goal: dev hybrid apps take a GPU lease on the cluster safely.
- Status: needs you:
  - (15) stamp night inference as steps 6 to 10 of the [cluster-first plan](https://app.notion.com/p/3f34a78a1c8781598959f1534a4ba38e)
  - (16) merge step 2 [#14679](https://github.com/reductoai/api/pull/14679).
- Done: step 2 built (the GKE placer), CI green.
- Impact: not measured yet: Modal spend moved to the cluster. [Details](https://app.notion.com/p/41d4a78a1c878114822fc589fa42dd25)
- Left: the infra steps; nothing serves from it until they run.
- Owner: Xavier · [#14679](https://github.com/reductoai/api/pull/14679) · [Page](https://app.notion.com/p/41d4a78a1c878114822fc589fa42dd25)

### \[p1\] Inference observability

- Goal: one health dashboard, plus per model monitors paging only on customer failures.
- Status: needs you:
  - (17) merge the counter overcounting fix [#15422](https://github.com/reductoai/api/pull/15422) (79 counters, CI guard); Mary rolls the collector to all regions after merge
  - (18) merge the four false-alarm monitor fixes [#15391](https://github.com/reductoai/api/pull/15391) (with [#15394](https://github.com/reductoai/api/pull/15394) stacked: router leases on Modal count in the fully-on-Modal monitor; now also fixes the agentic monitor).
- Done: Burst graph worker monitor fix [#15388](https://github.com/reductoai/api/pull/15388) ✅. Counter overcounting fix plan stamped. [#13977](https://github.com/reductoai/api/pull/13977) ✅ (Latency and Reliability views), [#15226](https://github.com/reductoai/api/pull/15226) ✅, [#15304](https://github.com/reductoai/api/pull/15304) ✅ (AU alert floor), [#15305](https://github.com/reductoai/api/pull/15305) ✅, [#15388](https://github.com/reductoai/api/pull/15388) ✅.
- Impact: false pages: qwen-rfdetr read 99% on Modal, really 1.7% (fixed by [#15391](https://github.com/reductoai/api/pull/15391)); not measured yet: failed/fallback pages caught. [Details](https://app.notion.com/p/4164a78a1c87815ab05ec4210066571d)
- Left: merge [#15391](https://github.com/reductoai/api/pull/15391) and [#15394](https://github.com/reductoai/api/pull/15394); cancel old downtime; move monitors to #inference-alerts.
- Owner: Mary · <mention url="https://app.notion.com/p/4164a78a1c87815ab05ec4210066571d">@Last Wednesday .Inference observability</mention>

### \[p1\] Global is fair game

- Goal: serve global residency work on idle EU and AU capacity, never breaking residency.
- Status: needs you:
  - (19) decide whether a BAA means US only (194 accounts; global share drops from 97.6% to \~67% if yes)
  - EU prod router deployed 14:57 PT with lending off; only the BAA question is left before lending.
- Done: Residency orgs missing a region flag confirmed (Nov 19). plan written; step 1 [#15234](https://github.com/reductoai/api/pull/15234) ✅ merged; step 2 counter [#15396](https://github.com/reductoai/api/pull/15396) ✅ merged (\~09:35 PT Nov 19). 98.1% of US jobs (99.4% of pages, Nov 12 to 18) are global, now on the plan page.
- Impact: not measured yet: global work served on idle EU/AU capacity, GPU cost per 1k pages. [Details](https://app.notion.com/p/41c4a78a1c8780a9bb45d6c87e15a019)
- Left: rest of steps 2 to 8. Jensen is checking every residency org has the <code>us</code> flag before any lending.
- Owner: Xavier · <mention url="https://app.notion.com/p/41c4a78a1c8780a9bb45d6c87e15a019">@Tuesday.Global is fair game</mention>

### \[p1\] R-1 and R-1 mini serving profiles

- Goal: R-1 and R-1 mini prod serving profiles on every card (12 profiles).
- Status: needs you:
  - (20) merge the R-1 B300 profile [#15217](https://github.com/reductoai/api/pull/15217) (clean). No target picks it yet: the B300 endpoint stall is still unexplained.
  - (21) review the R-1 H200 profile [#15249](https://github.com/reductoai/api/pull/15249) (3.70 pages/s, \$0.341 per 1k pages).
  - (22) review the small-card exclusions note [#15207](https://github.com/reductoai/api/pull/15207).
  - (23) review the A100 INT8 scripts [#15354](https://github.com/reductoai/api/pull/15354).
  - (24) merge the B300 lever measurements [#15479](https://github.com/reductoai/api/pull/15479) (clean; no lever wins in every cell, so nothing ships). Encoder CUDA graphs rejected (+2 to +6% at 64 in flight, -1 to +8% at 128, one stall). [B300 page](https://app.notion.com/p/41d4a78a1c8781a4ad89e88f7360607d).
  - Still untried on B300: torch.compile on encoder attention, AMD hosts.
  - Held until you want them on RL 299 (only measured on old 1028 weights): L4/A10G/A100 40GB, Inferentia2, TPU v6e.
- Done: 6 of 12 profiles merged: R-1 H100 [#15237](https://github.com/reductoai/api/pull/15237) ✅, R-1 A100 80GB [#15230](https://github.com/reductoai/api/pull/15230) ✅, R-1 L40S [#15242](https://github.com/reductoai/api/pull/15242) ✅ (two L40S at TP2), R-1 mini H200 [#15275](https://github.com/reductoai/api/pull/15275) ✅, R-1 mini B300 [#15348](https://github.com/reductoai/api/pull/15348) ✅, R-1 mini A100 [#15276](https://github.com/reductoai/api/pull/15276) ✅.
- Impact: not measured yet: pages/s per chip. [Details](https://app.notion.com/p/41d4a78a1c8781708106d996692557da)
- Left: merge the 5 PRs above; decide on the 3 held profiles.
- Owner: Jensen · [Page](https://app.notion.com/p/41d4a78a1c8781708106d996692557da)

## Running

### \[p0\] B200 GPU sharing

- Goal: guarantee each B200 model its minimum, share the rest, end fpp-35b and Maverick shortages on use1 and uss1.
- Status: rolling out: Mary is re-promoting all GPU clusters to main 8122ce7 (with fpp-35b checkpointing) after the uss1 burst snapshot was deleted.
- Done: [#15259](https://github.com/reductoai/api/pull/15259) ✅. Rollback fix [#15380](https://github.com/reductoai/api/pull/15380) ✅ (a failed rollback no longer restores the old pin). [plan](https://app.notion.com/p/41c4a78a1c878179a3f4d03746e1ad63) stamped; [#15259](https://github.com/reductoai/api/pull/15259) ✅ merged; [#15380](https://github.com/reductoai/api/pull/15380) ✅.
- Impact: not measured yet: pending GPU pods on use1/uss1 (24 at 17:28 PT before rollout). [Details](https://app.notion.com/p/41c4a78a1c878179a3f4d03746e1ad63)
- Left: finish the all-cluster promote, then measure pending GPU pods, utilization and Modal spend after.
- Owner: Xavier · <mention url="https://app.notion.com/p/41c4a78a1c878179a3f4d03746e1ad63">B200 GPU sharing: guarantee each model's minimum, share the rest</mention>

### \[p0\] Router for R-1 mini RL 299

- Goal: pick RL 299's page router by Fri 11/20.
- Status: paused: the new R-1 checkpoint hasn't landed (newest R-1 mini is RL 299, shadow only); its two asks are snoozed to tomorrow.
- Done: RL 299 shadow on Modal dev ([#15274](https://github.com/reductoai/api/pull/15274)).
- Impact: not measured yet: judge score, GPU cost per 1k pages. [Details](https://app.notion.com/p/41c4a78a1c87813d981ff3cab9633dcf)
- Left: retrain both routers, compare offline, 24 h autoeval each, you decide.
- Owner: Xavier · <mention url="https://app.notion.com/p/41c4a78a1c87813d981ff3cab9633dcf">Router for R-1 mini RL 299 (paused until new R-1)</mention>

### \[p0\] us-west-3 cluster

- Goal: prod-gpu-usw3 (GKE) ready for the new B200 reservation.
- Status: on track.
- Done: serving Maverick, fpp-35b and fpp-2b.
- Impact: not measured yet: GPU capacity added, Modal spend. [Details](https://app.notion.com/p/4144a78a1c87803f928cff480072bd48)
- Left: review static ScaledObjects and node-local cache.
- Owner: Mary · <mention url="https://app.notion.com/p/4144a78a1c87803f928cff480072bd48">@Last Tuesday.us-west-3 cluster</mention>

### \[p1\] vLLM 0.34 migration

- Goal: move every vLLM workload to 0.34.
- Status: on track:
  - Hemingway's text is on the [plan page](https://app.notion.com/p/41d4a78a1c878146a5a9d2441c4aa0ff); fpp-2b block size pinned to 1024 there.
  - Step 1, the 0.34 runtime build, is running (Mary).
  - Jensen is migrating the Modal R-1, magpie and fpp-flash recipes to 0.34.
- Done: plan stamped (Nov 19).
- Impact: not measured yet: per-model pages/s and GPU cost per 1k pages before vs after.
- Left: rest of the cluster steps (Mary); Modal-only workloads and release watching (Jensen).
- Owner: Mary (cluster steps), Jensen (Modal-only workloads, release watching) · [Page](https://app.notion.com/p/41d4a78a1c878146a5a9d2441c4aa0ff)

### \[p1\] Lower priority calls to the cluster

- Goal: move dev and eval calls from Modal dev to idle prod GPUs (11 to 36% busy by day).
- Status: on track: ships off by default with the all-cluster promote to main 8122ce7. Step 2 (push-pull) is stamped and waits on paused step 1.
- Done: Step 2 (push-pull) stamped. [#15178](https://github.com/reductoai/api/pull/15178) ✅ (off by default). lease limit design built [#15178](https://github.com/reductoai/api/pull/15178) ✅.
- Impact: not measured yet: cluster utilization, p99 latency of priority calls. [Details](https://app.notion.com/p/41b4a78a1c878080b5c2c23c0a1e7661)
- Left: turn on per caller.
- Owner: Xavier · <mention url="https://app.notion.com/p/41b4a78a1c878080b5c2c23c0a1e7661">@Tuesday.Lower priority calls to the cluster</mention>

### \[p1\] R-1 mini optimization and productionizing

- Goal: RL 299 in prod on every chip at lowest cost per 1k pages.
- Status: on track. No current pick serves the FP8 variant.
- Done: R-1 A100 INT8 package [#15230](https://github.com/reductoai/api/pull/15230) ✅ (\~09:30 PT Nov 19); B300 package [#15348](https://github.com/reductoai/api/pull/15348) ✅ merged; all-chip roofline [#15342](https://github.com/reductoai/api/pull/15342) ✅; R-1 nano draft registry [#15241](https://github.com/reductoai/api/pull/15241) ✅; A100 package [#15276](https://github.com/reductoai/api/pull/15276) ✅ (not deployed); R-1 A100 INT8 checkpoint on HF (reducto/fpp\_35b\_int8\_a100\_20261118). RL 299 packages measured on H100 INT8 (AU). B300 [#15385](https://github.com/reductoai/api/pull/15385) ✅, [#15369](https://github.com/reductoai/api/pull/15369) ✅; no current pick serves the FP8 variant.
- Impact: B300 FP8 vision attention: +10 to 12% pages/s at 128 in flight on AMD hosts, +3 to 5% on Intel; B300 21.4 vs B200 32.2 pages/s per container; not measured yet: prod GPU cost per 1k pages. [Details](https://app.notion.com/p/41c4a78a1c878105af45c7991e8054c3)
- Left: B200 prod pick; deploy A100; all-region rollout with AU on H100 after autoeval; rest of the B300 gap (no sm103 INT8 attention): lever sweep found no all-cell winner ([B300 page](https://app.notion.com/p/41d4a78a1c8781a4ad89e88f7360607d)); torch.compile on encoder attention and AMD hosts untried.
- Owner: Xavier (Jensen on the B300 kernel) · <mention url="https://app.notion.com/p/41c4a78a1c878105af45c7991e8054c3">R-1 mini optimization and productionizing</mention> · AU detail: <mention url="https://app.notion.com/p/41c4a78a1c878145ac76f1795c896483">R-1 mini RL 299 as INT8 on H100 (AU)</mention>

### \[p1\] Serving improvements across all models

- Goal: keep finding serving improvements for every model.
- Status: on track (standing job).
- Done: none yet.
- Impact: each plan carries measured before vs after. [Details](https://app.notion.com/p/41d4a78a1c8781f883fed82822adeceb)
- Left: each improvement comes to you as a plan to stamp.
- Owner: Jensen · [Page](https://app.notion.com/p/41d4a78a1c8781f883fed82822adeceb)

### \[p1\] Overshoot 1112 R-1 35B package

- Goal: test offline, ship if it holds (Overshoot claims 21 to 42% more pages/s).
- Status: on track.
- Done: none yet.
- Impact: not measured yet: pages/s, GPU cost per 1k pages. [Details](https://app.notion.com/p/4164a78a1c878172b7cfcb952321422f)
- Left: offline A/B, autoeval.
- Owner: Jensen · <mention url="https://app.notion.com/p/4164a78a1c878172b7cfcb952321422f">.Overshoot 1112 R-1 35B package: offline A/B and autoeval</mention>

### \[p1\] Exa eval

- Goal: price R-1 nano for Exa at \$0.25 to \$1 per 10k pages.
- Status: held until you say go.
- Done: [plan](https://app.notion.com/p/41c4a78a1c8781009a33ece713086e73) stamped. price model. ParseJudge hard cases, 10k pages: metadata 4.7 vs 8.2 for R-1 nano; nano 7.7 vs 9.0 for R-1 mini (posted in Slack).
- Impact: eval only, no prod change yet. [Details](https://app.notion.com/p/41c4a78a1c8781009a33ece713086e73)
- Left: the plan's replay, on your go.
- Owner: Xavier · <mention url="https://app.notion.com/p/41c4a78a1c8781009a33ece713086e73">Exa eval: R-1 nano and metadata routing at $0.25 to $1 per 10k pages</mention>

### \[p1\] R-1 nano serving throughput

- Goal: push R-1 nano serving throughput further.
- Status: on track (Jensen started it).
- Done: none yet.
- Impact: not measured yet: pages/s. [Details](https://app.notion.com/p/41d4a78a1c8781bfadd4e344ff4f70cc)
- Left: in progress.
- Owner: Jensen · [Page](https://app.notion.com/p/41d4a78a1c8781bfadd4e344ff4f70cc)

### \[p2\] GPU cluster observability and utilization

- Goal: higher GPU cluster utilization.
- Status: on track.
- Done: usw1 qwen RF-DETR at 5 seats held 24 h: p99 1.33 s, under the 1.5 s line in all 8 windows, same throughput as 6 seats; Modal share 26% vs 15% with demand +10%. [#15158](https://github.com/reductoai/api/pull/15158) ✅ + Deploy, [#15153](https://github.com/reductoai/api/pull/15153) ✅.
- Impact: usw1 qwen RF-DETR 6 → 5 seats at the same throughput and p99 (1.33 s); Modal share 15% → 26% on +10% demand. [Details](https://app.notion.com/p/41b4a78a1c87810f8533dda3777fba9f)
- Left: vLLM 0.34 bench; B200 node pool upgrade (Terraform, you apply); usw3 review.
- Owner: Mary · <mention url="https://app.notion.com/p/41b4a78a1c87810f8533dda3777fba9f">GPU cluster observability and utilization</mention>

### \[p2\] Parse-trust router on TPU v6e

- Goal: serve the parse-trust router from a lean JAX server on TPU v6e.
- Status: on track (started by Jensen; flag-gated, no plan needed).
- Done: plan written.
- Impact: not measured yet: cost per call vs GPU. [Details](https://app.notion.com/p/41d4a78a1c87811386cef6aab7bc1226)
- Left: everything after the stamp.
- Owner: Jensen · [Page](https://app.notion.com/p/41d4a78a1c87811386cef6aab7bc1226)

## Your own work

### v3 GPU routing question

- Status: a [Colab notebook](https://colab.research.google.com/drive/12EZucLxYTR1ppAnW6Uudxz7rxH3OdcoT); on [today's @Today page](https://app.notion.com/p/41d4a78a1c87812eaf15cd6acd6d2b8b).
- Owner: you

### Roadmap review

- Status: refreshed with this week's numbers and chart (16:15 PT) on the [Roadmap Review](https://app.notion.com/p/41d4a78a1c87812eaf15cd6acd6d2b8b) toggle.
- Owner: you

### \[p2\] Training CLI (src/hacky/training)

- [#15331](https://github.com/reductoai/api/pull/15331): modal and baseten hosts behind [launch.py](http://launch.py); move Baseten training here.
- [#15327](https://github.com/reductoai/api/pull/15327): profile/starved divides by real wall-clock.

<toggle>
Done

- R-1 routing in shadow · Xavier · at 0.58, 28% of pages go to R-1; judge 9.32 vs 9.12 R-1 mini alone, 9.45 R-1 alone · [page](https://app.notion.com/p/41a4a78a1c8780be9c83d3f02a810d07)
- Inference docs and memory cleanup · Hemingway · [#15163](https://github.com/reductoai/api/pull/15163) ✅ (258 fewer words) · <mention url="https://app.notion.com/p/41b4a78a1c87810ba012d0525c1fa9e3">Inference docs and memory cleanup</mention>
- Baseten cluster · Raymond · closed unmerged: you closed the yield loop stack ([#14512](https://github.com/reductoai/api/pull/14512), [#14513](https://github.com/reductoai/api/pull/14513), [#14515](https://github.com/reductoai/api/pull/14515), [#14516](https://github.com/reductoai/api/pull/14516)) without merging · <mention url="https://app.notion.com/p/4154a78a1c8781938cd5edadb6a11751">Baseten cluster: training first, preemptible inference</mention>
</toggle>

<page url="https://app.notion.com/p/41d4a78a1c878114822fc589fa42dd25">
Cluster-first decorator
</page>

<page url="https://app.notion.com/p/41d4a78a1c8781f883fed82822adeceb">
Serving improvements across all models
</page>

<page url="https://app.notion.com/p/41d4a78a1c8781708106d996692557da">
R-1 35B serving profiles (B300, A100)
</page>

<page url="https://app.notion.com/p/41d4a78a1c8781bfadd4e344ff4f70cc">
R-1 nano serving throughput
</page>

<page url="https://app.notion.com/p/41d4a78a1c87811386cef6aab7bc1226">
Parse-trust router on TPU v6e
</page>

<page url="https://app.notion.com/p/41d4a78a1c8781018984cb3808816496">
Training CLI (src/hacky/training)
</page>

<page url="https://app.notion.com/p/41d4a78a1c878146a5a9d2441c4aa0ff">
vLLM 0.34 migration
</page>
