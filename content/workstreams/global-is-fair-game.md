# Global is fair game

Today, our warm capacity in the EU and AU is not very much used. However, we do have some workloads that have global residency: serving them anywhere is fair game. If these workloads can use that global capacity, while scaling up their regional capacity, this…

<div class="ws-head">
<div class="ws-stat"><b>6</b><span>steps left</span></div>
<div class="ws-stat"><b>3</b><span>PRs merged</span></div>
<div class="ws-stat"><b>1</b><span>PRs open</span></div>
<div class="ws-stat"><b>6</b><span>impact measures</span></div>
</div>

## Next steps

<ol class="steps"><li class="now">Step 1: router and R-1 calls know global (PR 15234, merged)</li><li>Step 2: count global calls and time the US to EU path</li><li>Step 3: US calls borrow EU capacity as low-priority calls through the EU router (on top of PR 15178)</li><li>Step 4: EU lend limit set by feedback (same controller code as the low-priority limit)</li><li>Step 5: US router sends global calls to the EU router</li><li>Step 6: one Doppler key for the EU router in the US router Secret (Jean)</li></ol>

## Impact

<div class="impact-grid"><div class="impact-card"><div class="ic-label">Baseline</div><div class="ic-value"><b>98.1%</b> of US jobs (<b>99.4%</b> of pages) have no residency limit, so they can run in EU or AU. Measured on US prod jobs, Nov <b>12</b> to <b>18 </b>(Jensen), reported 2026-11-18.</div></div><div class="impact-card"><div class="ic-label">Before, EU warm slots in use (Tinybird, Nov 16 to 18 UTC)</div><div class="ic-value">maverick <b>3.1%</b> of <b>155,</b> figsum <b>2.0%</b> of <b>198,</b> fpp-35b <b>1.2%</b> of <b>97,</b> extract-v4-magpie <b>0.5%</b> of <b>23,</b> citation-7b <b>0.3%</b> of <b>12,</b> fpp-2b <b>0.2%</b> of <b>92.</b></div></div><div class="impact-card"><div class="ic-label">Before, minutes with a US queue</div><div class="ic-value"><b>2.2%</b> (fpp-2b) to <b>11.1%</b> (citation-7b); the largest average queue is <b>22.0</b> calls (fpp-35b). In each of those minutes the EU had an idle slot.</div></div><div class="impact-card"><div class="ic-label">After</div><div class="ic-value">no call moves yet. Step <b>1 </b>(PR <b>15234</b>) is merged and no environment has a global_only cluster.</div></div><div class="impact-card"><div class="ic-value">First split of router admits (Datadog router.admit.global, #<b>15396,</b> read 2026-11-19 <b>15</b>:<b>00</b> PT). US prod, <b>10</b>:<b>18</b> to <b>15</b>:<b>00</b> PT Nov <b>19</b>: <b>89%</b> of <b>6.36M</b> admits come from jobs with no…</div></div><div class="impact-card"><div class="ic-value">EU utilization, calls served on EU slots instead of waiting, US waited share and GPU cost per 1k pages: not measured yet; measure at step <b>8.</b></div></div></div>

## PRs

<div class="pr-grid"><a class="pr-chip merged" href="https://github.com/reductoai/api/pull/15234"><b>#15234</b><span>merged</span><em>Step 1: router and R-1 calls know global (PR 15234, merged)</em></a><a class="pr-chip merged" href="https://github.com/reductoai/api/pull/15396"><b>#15396</b><span>merged</span><em>Counter per namespace, global or resident (PR 15396, merged). Only R-1 calls send global…</em></a><a class="pr-chip merged" href="https://github.com/reductoai/api/pull/15397"><b>#15397</b><span>merged</span><em>Counter per namespace, global or resident (PR 15396, merged). Only R-1 calls send global…</em></a><a class="pr-chip open" href="https://github.com/reductoai/api/pull/15178"><b>#15178</b><span>open</span><em>Step 3: US calls borrow EU capacity as low-priority calls through the EU router (on top…</em></a></div>

## Details

<details>
<summary>Overview</summary>

<p>
Today, our warm capacity in the EU and AU is not very much used. However, we do have some workloads that have <code>global</code> residency: serving them anywhere is fair game. If these workloads can use that global capacity, while scaling up their regional capacity, this could save us money. 
</p>

<details>
<summary>Goals</summary>

- Send <code>global</code> workloads anywhere

</details>

<details>
<summary>Constraints</summary>

- Never violate data residency

</details>

<details>
<summary>Feasibility and Impact</summary>

- About 98% of US jobs are <code>global</code> (Nov 12 to 18).
  - Jobs: 98.1% of 8.36M US jobs with an org id are <code>global</code>. The other 1.9% (155k) are US resident and stay in the US.
  - Pages: 99.4% of 82.7M are <code>global</code>.
  - A US job is resident only when its org has an active <code>us</code> flag. 31 orgs (17 accounts) have the flag, and 14 of them sent jobs that week.
  - EU jobs are never <code>global</code>: every one is <code>EU</code>. AU sent 11k jobs.
  - Source: Tinybird <code>job_analytics</code> by org, joined with Snowflake <code>CORE.ADMIN.DATA_RESIDENCY_ORGS</code>. 1.48M more US jobs have no org id in that table. In a 16-hour sample, every one matched an org through <code>analytics_events</code>, and 5.6% belong to flagged orgs. With them the share is about 97.6%.
- The share is only as good as the flags. Some contracts with a residency clause have no flag yet (sent to Jean, Nov 18). No lending before that list is clean.
- Feasible for the EU now. The EU router holds warm Modal slots for 6 namespaces, almost all idle. AU has no router traffic and no controller, only the R-1 mini floor on Modal.
- Tinybird, Nov 16 to 18 UTC, by minute. In use = router leases over warm slots. Movable = share of the US queue an idle EU slot could have taken.

| Namespace | EU slots | EU in use | Minutes with a US queue | Avg US queue | Movable |
| --- | --- | --- | --- | --- | --- |
| <code>maverick</code> | 155 | 3.1% | 2.8% | 9.8 | 28% |
| <code>figsum</code> | 198 | 2.0% | 5.4% | 3.0 | 75% |
| <code>fpp-35b</code> | 97 | 1.2% | 3.8% | 22.0 | 16% |
| <code>extract-v4-magpie</code> | 23 | 0.5% | 7.3% | 1.7 | 48% |
| <code>citation-7b</code> | 12 | 0.3% | 11.1% | 1.7 | 32% |
| <code>fpp-2b</code> | 92 | 0.2% | 2.2% | 3.6 | 26% |

- In every minute with a US queue, the EU had at least one idle slot.
- Movable assumes every US call is <code>global</code>. About 98% of US jobs are, so the real share is close. Step 2 counts it per namespace.
- Residency: the worker marks a call <code>global</code> only when the job's resolved residency is <code>GLOBAL</code> and the job is not AU-restricted. Only such a call gets a cluster in another region. EU jobs are always <code>EU</code>, so no EU call leaves the EU.

</details>

<details>
<summary>Metrics</summary>

- Utilization in EU and AU
- Number of calls that are served instead of waiting

</details>

<details>
<summary>Questions </summary>

- What share of US calls is <code>global</code>? Answered (Nov 18): about 98% of US jobs, 99.4% of pages (Feasibility). Step 2 still counts calls per namespace. US-flagged accounts on the US endpoint stay in the US.
- How many EU slots can the US take? Answered (Jean, Nov 17): no fixed reserve; the EU controller sets the lend limit by feedback (step 4).
- Is latency fine for a US worker calling EU Modal? The page image crosses the Atlantic twice. Step 2 measures it on staging before prod.
- AU? Answered (Jean, Nov 17): out for now. Modal cannot place the 35B in AU. Decide again after the step 8 read, once AU R-1 mini is on the router.

</details>

---

</details>

<details>
<summary>Execution</summary>



</details>

<details>
<summary>Plan</summary>

- Step 1: router and R-1 calls know <code>global</code> ([PR 15234](https://github.com/reductoai/api/pull/15234), merged)
  - A <code>global_only</code> cluster serves only <code>global</code> calls, and only when their region is full.
  - No call moves yet: no environment has such a cluster.
- Step 2: count <code>global</code> calls and time the US to EU path
  - Counter per namespace, global or resident ([PR 15396](https://github.com/reductoai/api/pull/15396), merged). Only R-1 calls send <code>global</code> today; the other five router callers send it with [PR 15397](https://github.com/reductoai/api/pull/15397) (merged).
  - Time 100 R-1 pages from a US worker to EU staging Modal, against the same pages in the US.
- Step 3: US calls borrow EU capacity as low-priority calls through the EU router (on top of [PR 15178](https://github.com/reductoai/api/pull/15178))
  - A lent call never queues: the EU router refuses it (429) when an EU call waits or the lend limit is reached.
  - Why the EU router: the EU is Modal only, and Modal's capacity answer has no calls in flight. Only an EU lease lets the EU cap count the US call.
  - A lent lease stays out of the Modal target, so it never adds an EU container.
  - PR 15178 allows low-priority calls on GPU clusters only; this PR extends it to Modal.
- Step 4: EU lend limit set by feedback (same controller code as the low-priority limit)
  - One number per namespace. Starts at 0.
  - +1 each tick while no EU call waits and the EU has a free slot.
  - Halves when an EU call waits while a lent lease is live. <code>router.lend_displaced</code> counts each halving.
  - The key expires after 30 s, so a stopped controller stops lending.
- Step 5: US router sends <code>global</code> calls to the EU router
  - The EU router is the US router's <code>global_only</code> cluster, capped at the lend limit the EU reports (US controller writes it with a 30 s expiry).
  - A refused call goes back to the US queue. The call span names the serving region.
- Step 6: one Doppler key for the EU router in the US router Secret (Jean)
  - Nothing is on before this.
- Step 7: turn it on per namespace (1 values PR each; Jean deploys all regional routers together)
  - <code>fpp-35b</code> first, the largest US queue. PostHog share 10, 25, 50, 100.
  - Then <code>fpp-2b</code>, maverick, figsum, magpie, citation. Each call site first passes <code>global</code>.
- Step 8: read the metrics after one week
  - EU utilization (leases over slots), calls served on EU slots instead of waiting, US waited share, halvings.

</details>

<details>
<summary>Logs</summary>

- Nov 17, 6:05 PM PT: measured EU slots and the US queue (Feasibility). Step 1: [PR 15234](https://github.com/reductoai/api/pull/15234) in review; Jean deploys the router, no config change.
- Nov 17, 6:30 PM PT: wrote steps 2 to 8. No PR work on them until Jean stamps the plan.
- Nov 18, 5:25 PM PT: measured the <code>global</code> share of US jobs: 98.1% of jobs, 99.4% of pages (Feasibility).
- Nov 18, 5:30 PM PT: checked the residency flags against contracts, Salesforce and Attio. With the jobs that have no org id, the share is about 97.6%. Some accounts with a residency clause or a BAA have no flag. List sent to Jean.
- Nov 18, 5:37 PM PT: step 1 merged ([PR 15234](https://github.com/reductoai/api/pull/15234)). No call moves yet.
- Nov 19, 2:54 AM PT: Jean stamped the plan. Every lending switch stays off until he settles the missing flags and what a BAA means.
- Nov 19, 3:02 AM PT: step 2 counter opened ([PR 15396](https://github.com/reductoai/api/pull/15396)). The timing is not run: EU staging has no R-1 in the EU, so Jean is choosing between an EU staging deploy and 100 pages on prod EU off-peak.
- Nov 19, 3:14 AM PT: the other five router callers send <code>global</code> ([PR 15397](https://github.com/reductoai/api/pull/15397)). No call moves.
- Nov 19, 9:35 AM PT: both step 2 PRs merged ([PR 15396](https://github.com/reductoai/api/pull/15396), [PR 15397](https://github.com/reductoai/api/pull/15397)). The counter reports after the next router deploy. The timing still waits on Jean's choice.

</details>

<details>
<summary>Impact</summary>

- Baseline: 98.1% of US jobs (99.4% of pages) have no residency limit, so they can run in EU or AU. Measured on US prod jobs, Nov 12 to 18 (Jensen), reported 2026-11-18.
- Before, EU warm slots in use (Tinybird, Nov 16 to 18 UTC): maverick 3.1% of 155, figsum 2.0% of 198, fpp-35b 1.2% of 97, extract-v4-magpie 0.5% of 23, citation-7b 0.3% of 12, fpp-2b 0.2% of 92.
- Before, minutes with a US queue: 2.2% (fpp-2b) to 11.1% (citation-7b); the largest average queue is 22.0 calls (fpp-35b). In each of those minutes the EU had an idle slot.
- After: no call moves yet. Step 1 ([PR 15234](https://github.com/reductoai/api/pull/15234)) is merged and no environment has a <code>global_only</code> cluster.
- First split of router admits (Datadog <code>router.admit.global</code>, [#15396](https://github.com/reductoai/api/pull/15396), read 2026-11-19 15:00 PT). US prod, 10:18 to 15:00 PT Nov 19: 89% of 6.36M admits come from jobs with no residency rule (R-1 mini 99.5%, Citation 7B 99.0%, highlight detection 98.1%, R-1 96.6%, FigSum 96.2%, Qwen 95.2%, core CV 94.9%, Magpie 94.4%, change tracking 78.9%, Maverick 76.4%). EU prod (router deployed 14:57 PT): 1,183 admits in two minutes, none. Nothing is lent: no prod config has a cross-region cluster.
- EU utilization, calls served on EU slots instead of waiting, US waited share and GPU cost per 1k pages: not measured yet; measure at step 8.

</details>

