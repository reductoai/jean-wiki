# More apps on the inference router

Goal: every Modal app on the router, Modal floors at 1, each cheaper per call.

## Plan

- Citation 7b(all regions)
  - AU: no router route
- Magpie
  - AU: no router route
- Remove ramp-up feature flags for everyone
- Apps still off the router
  - 20.6K USD a week of prod Modal, 15% of 138.4K (Nov 12 to 18): chicken 5.0K, extract confidence 6.2K (two apps), layout 3.0K (two apps), ordering 1.7K, small apps 4.7K
  - Chicken: ramp once [#15451](https://github.com/reductoai/api/pull/15451) is merged and released, all regions together
  - Extract confidence, layout, ordering, in that order: PR at 0% share, then the ramp, as for Triton ([#14977](https://github.com/reductoai/api/pull/14977)), all regions together
  - Layout (two apps): needs an HTTP route on the GPU app first
    - Waiting for Jean's stamp: no replay or code before it
    - Not a share-0 PR: both apps take Modal function calls (<code>get_layout</code>), and the router only carries HTTP. The prompt, model call and box parsing all run inside the GPU app.
    - Prod Modal, Nov 12 to 18:
      | App | Spend | Calls | Regions | Floor today |
      | --- | --- | --- | --- | --- |
      | Eve Legal (<code>qwen3_4b_layout_eve</code>) | 2,417 USD | 1,816,796 | US | 0 |
      | Promptable (<code>qwen4b-layout-promptable-server</code>) | 579 USD | 25,906 | US | 1 |
    - Promptable stays direct. It spends a flat 83 USD a day on its floor of one warm container, and the router keeps that floor.
    - Eve Legal, three steps:
      1. <b>Replay first, no code:</b> run last week's calls through the controller's scaling rule and compare with today's (floor 0, 30 s scale-down). Stop if it saves nothing.
         - The controller needs a floor of at least 1, so routing Eve Legal adds a warm container whenever it would sit at zero: up to about 100 USD a day (other one-container floors bill 83 to 97).
      2. PR: HTTP route on the GPU app.
         - A second server class on the same app serves the model's chat endpoint over HTTP, as the ordering app does. The prompt and box parsing move to the worker, behind a flag at 0.
         - The old class stays until the flag reaches 100 and one release has passed.
         - Before any traffic moves: a replay of prod pages returns the same boxes as today.
      3. PR: Eve Legal behind the router at share 0, as ordering did ([#15477](https://github.com/reductoai/api/pull/15477)). Then the ramp.
    - Step 2 risk: it redeploys the GPU app behind every Eve Legal layout call (1.8M a week). The new class takes its own GPU snapshot and containers, and the two classes do not share load, so spend rises until the old class goes. Not estimated.
    - Not measured: the saving (no GPU cluster serves layout, so the router can only tighten Modal's scaling), and how much of the day Eve Legal sits at zero containers.
  - Chicken is also step 4 of <a href="https://app.notion.com/p/41d4a78a1c8781bab755f4b688445019">Night inference on the GPU clusters: findings</a>
  - Verify per app: p99 per call does not move; Modal USD per 1k calls before and after; the extra network leg through the router, not measured yet
  - Small apps (deep extract v4c, OCR v3, citation, parse trust, classify) only if the first four save

## Logs

### AU R-1 mini

- Capacity sidecar for the INT8 class: [#15203](https://github.com/reductoai/api/pull/15203) ✅ + Deploy (answers in prod\_au, 1.4 s a count)
- Flag <code>inference_router_au_fpp_2b_pct</code> created in PostHog at 0
- Router size: 3 c8gn/c8in.4xlarge nodes since the install, about 89 USD a day. [#15461](https://github.com/reductoai/api/pull/15461) clean, ready for the merge.
- [#14888](https://github.com/reductoai/api/pull/14888) ✅ + Deploy
- \[2026-11-16 15:46 PT\] Ramp, US: 25 (15:17) → 50 (15:31) → 100 (15:46). No fallbacks or errors.
- Slots mode, floor 1, US (with Magpie): [#15050](https://github.com/reductoai/api/pull/15050) ✅ + Deploy (Nov 17 11:36 release, [run](https://github.com/reductoai/api/actions/runs/44160395281)). Live: containers equal the controller's target (the cron's 8 spare are gone), no cron write at 12:00. Admit wait p99 866 ms after (2.4 s at 10:05 to 11:05); 5.7 s p95 during the 20-minute redeploy.
- EU route: [#15134](https://github.com/reductoai/api/pull/15134) ✅ + Deploy (11:36 release, eu-prod router 12:58 on e03835693d)
- Ramp, EU, Nov 17: 10 (13:08) → 25 (13:36) → 50 (13:51) → 100 (14:58, Jean's go, floor unchanged). All 200. 1 warm container gives the router 6 seats, so bursts wait: about 14 calls wait 0.6 to 1.2 s.
- At 50%, 14:38: one customer sent about 500 calls in 2 minutes. Of 238 on the router, 137 served (admit wait p50 2.2 s, max 10 s), 101 hit the 10 s admit timeout and fell back to direct Modal; none failed. Modal's 29 new containers were ready 5 minutes later. Direct calls in the same burst were not held (p50 2.9 s).
- At 100%, first 9 minutes: 22 calls, all 200, no fallbacks, none direct, admit wait p50 1.2 s, p99 2.6 s.
- At 100%, 14:59 to 23:02 (to 08:00 in central Europe): 1,354 router calls, all 200, no fallbacks. Admit wait p50 52 ms, p99 2.8 s, max 5.0 s; 22% of calls waited 1 s or more on the 6 seats. Largest burst 86 calls a minute, so a 14:38-size burst is untested at 100%.

### EU Maverick 

- namespace ✓ [#14848](https://github.com/reductoai/api/pull/14848) + Deploy ✅
- callers ✓ [#14853](https://github.com/reductoai/api/pull/14853) + Deploy ✅
- eu-prod router deployed 17:06 (48cce118b3). Ramp: 10 (17:07) → 25 (17:20) → 50 (17:34) → 100 (17:48). No fallbacks. Bursts wait 2 to 5 s at p99: the router class has 1 warm container.

### Magpie

- [#14852](https://github.com/reductoai/api/pull/14852) ✅ + Deploy
- \[2026-11-16 15:46 PT\] Ramp, US: 10 (15:17) → 25 (15:31) → 50 (15:46) → 100 (16:01). No fallbacks.
- Slots mode, floor 1, US: [#15050](https://github.com/reductoai/api/pull/15050) ✅ + Deploy (Nov 17 11:36 release). Live: containers equal the controller's target, down to 1; no cron write at 12:00. Admit wait p99 7 ms after; up to 30 s during the redeploy.
- EU route: [#15134](https://github.com/reductoai/api/pull/15134) ✅ + Deploy (11:36 release, eu-prod router 12:58 on e03835693d)
- Ramp, EU, Nov 17: 10 (13:08) → 25 (13:36) → 50 (13:51) → 100 (14:58, Jean's go). At 50%: 769 router calls, all 200, no fallbacks, admit wait p99 8 ms. At 100%, first 9 minutes: 429 calls, all 200, no fallbacks, none direct, admit wait p99 8 ms.
- Slots mode, floor 1, EU: [#15196](https://github.com/reductoai/api/pull/15196) ✅ + Deploy (Nov 17 16:45 release, [run](https://github.com/reductoai/api/actions/runs/44207302381)). Live since 16:32: the controller writes 1 every minute, ready equals target (was 2 against 1 under the cron), no cron write at 17:00. First 30 minutes: 6 router calls (EU night), all 200, no fallbacks. Holds after the 18:25 release ([run](https://github.com/reductoai/api/actions/runs/44223075070)).
- EU at 100%, 14:59 to 23:02: 3,676 router calls, no fallbacks, admit wait p99 9 ms. One 400 (request over the context window; the job completed on its fallback model). Slots mode since 16:33: ready equals target every minute, target rose to 2 twice and returned to 1, no cron write.

### Triton segmentation:

- \[2026-11-16 11:49 PT\] Move segmentation to the router: ✓ [#14977](https://app.devin.ai/review/reductoai/api/pull/14977), at 0%. ✅ + Deploy
- \[2026-11-16 15:46 PT\] Ramp, US (change tracking, highlight detection): 10 (15:17) → 25 (15:31) → 50 (15:46) → 100 (16:01) → back to 25 (16:09). At 100 a burst queued in the router: admit wait p50 7 s, 20 calls timed out and went to direct Modal, no failed steps. usw1 has 20 to 24 seats and the Modal cap is 0, so nothing spills.
- Controller raise mode for the two Modal classes, so the router spills to Modal: [#15039](https://github.com/reductoai/api/pull/15039) ✅ + Deploy (16:40 release; live Modal cap 9 and 11)
- Ramp, US: 25 → 50 (16:56) → 100 (17:10). Modal spill serves, no queueing; highlight detection gets a rare usw1 500 (2 of 640) that falls back to Modal.
- Slots mode, floor 1, US: [#15142](https://github.com/reductoai/api/pull/15142) ✅ + Deploy (Nov 17 14:29 release, [run](https://github.com/reductoai/api/actions/runs/44186759496)). Live, 14:30 to 17:00: floor 1 when idle, up to 22 (change tracking) and 9 (highlight detection) on demand; ready never above target, below it for 11 and 5 of 140 minutes while Modal started containers; no cron write since 14:00.
- Same window: change tracking 9,642 router calls, all 200, 1 fallback (14:40, during a 1 → 8 burst, cause not confirmed). Highlight detection 10,797 calls, 8 usw1 500s, each served by direct Modal.
- After the 18:25 release ([run](https://github.com/reductoai/api/actions/runs/44223075070)), 18:20 to 18:44: floor 1, ready equals target every minute, 532 and 512 router calls, all 200, no fallbacks.

### EU Triton (core CV, Qwen RF-DETR, change tracking, highlight detection):

### Routes at share 0: [#15209](https://github.com/reductoai/api/pull/15209) ✅ + Deploy (Nov 17 18:25 release; eu-prod router 22:12 on 0386928344, [run](https://github.com/reductoai/api/actions/runs/44249258960)). Live: the router config has the four routes, the controller measures the four classes, the four EU shares started at 0.

### 10% (Nov 18 10:45 PT, the four EU PostHog values): 2,161 routed calls in 75 min, 6 fallbacks (a Modal 503 burst, same rate on direct calls), admit wait p99 49 ms, app spend flat at \$82/h.

### 25% (Nov 18 12:20 PT): 6,508 routed calls in 100 min, 6 fallbacks (0.09%), admit wait p99 81 ms, app spend \$81.83/h vs \$78.64 the same hour Nov 17. At 14:02 PT EU core-cv hung for 2 min (also Nov 17 14:00 PT, no router): direct calls failed at 30 s, routed ones at 45 s.

### EU core CV: moved to [EU core CV](https://app.notion.com/p/41d4a78a1c8781ceabf3c88b28d4894f)

### 100% (Nov 19 01:35 PT): first 16 min 8,905 routed calls, all 200, no fallbacks, admit wait p99 0.3 s. Spend at 100% not billed yet.

### YAML default 25: [#15309](https://github.com/reductoai/api/pull/15309), open.

### EU core CV: moved to [EU core CV](https://app.notion.com/p/41d4a78a1c8781ceabf3c88b28d4894f)

###  [#14863](https://github.com/reductoai/api/pull/14863)  on inference router ✅ + Deploy (16:40 release, eu-prod router 17:06)

- Ramp, US and EU: 10 (17:07) → 25 (17:20) → 50 (17:34) → 100 (17:48). No fallbacks.
- EU burst at 17:49 (1,881 calls in a minute, usually under 30): admit wait p50 7.5 s for 2 minutes while Modal went 1 → 16 containers. Back to 25 for a minute (17:54), then 100: the burst caused it, not the share.
- Slots mode, floor 1, US and EU: [#15206](https://github.com/reductoai/api/pull/15206) ✅ + Deploy (Nov 17 18:27 release). Live: ready equals target, no cron write since Nov 17 18:00. It dropped the cron's peak spare: calls waiting over 5 s for a seat went 0.8% → 4.9% (US) and 2.1% → 5.6% (EU), Nov 17 vs Nov 18, 06:00 to 14:00.


### Apps still off the router

- Chicken at share 0, US and EU: [#15451](https://github.com/reductoai/api/pull/15451), clean, waits on Jean's merge
- Extract confidence 1.7B at share 0, US only (EU floor is 0; a controller floor is at least 1): built and reviewed, opens once #15451 merges
- Extract confidence v3 at share 0, US and EU: [#15468](https://github.com/reductoai/api/pull/15468), clean, waits on Jean's merge
- Ordering at share 0, US and EU: [#15477](https://github.com/reductoai/api/pull/15477), clean, waits on Jean's merge
- Unused confidence RPC class, floor 1 to 0 in US and EU: [#15464](https://github.com/reductoai/api/pull/15464), clean, waits on Jean's merge. About 177 USD a day idle; 0 calls in 7 days (measured Nov 19)

### Rollout dashboard

- \[2026-11-16 15:29 PT\] [Rollout tab](https://us3.datadoghq.com/dashboard/jhy-7wx-adw/inference-router): router side and Triton pick up every namespace / model, no list.
- Direct side by namespace: [#15032](https://github.com/reductoai/api/pull/15032) ✅ + Deploy (17:17 release). Direct side now by namespace too, no app list (18:10); citation 7b is one row.


<details>
<summary>EU R-1 / R-1 mini ✅</summary>


- controller  [#14449](https://github.com/reductoai/api/pull/14449) + Deploy ✅
- callers ✓ [#14455](https://github.com/reductoai/api/pull/14455) + Deploy ✅
- Ramp at 100% ✅
- Slots mode: already on since #14449 (controller owns the floors, no cron)
- Floors 6 / 5 → 1 [#15004](https://github.com/reductoai/api/pull/15004) ✅ + Deploy (\~6.2 B200, \~\$28k/month; AU has no controller)

</details>


<details>
<summary>Moved</summary>


<b>100% eligible traffic, including Modal spill; controller-owned floors.</b>

- <b>Maverick:</b> serving ✓ [#13501](https://github.com/reductoai/api/pull/13501) → controller ✓ [#13502](https://github.com/reductoai/api/pull/13502) → default route ✓ [#14115](https://github.com/reductoai/api/pull/14115).
- <b>R-1 mini:</b> route ✓ [#13775](https://github.com/reductoai/api/pull/13775) → floor cutover ✓ [#14042](https://github.com/reductoai/api/pull/14042).
- <b>R-1:</b> route ✓ [#14114](https://github.com/reductoai/api/pull/14114) → stop cron ✓ [#14131](https://github.com/reductoai/api/pull/14131) → controller ✓ [#13560](https://github.com/reductoai/api/pull/13560).

- [Plan: citation\_7b on usw1 H200s](https://app.notion.com/p/4174a78a1c87818a9115fc5146e0e758)

</details>


## Cost per call, before vs after the router

Measured 2026-11-19 (data through 11-18 UTC). USD per 1k ok calls, or per 1k pages for R-1 and R-1 mini. Cost is the Modal bill plus cluster GPUs: 5.50 USD per B200-hour and 5.721 USD per usw1 H200-hour. The H200 rate is the AWS capacity block cr-0d9e87335cf324c07 (AWS Cost Explorer, May 2026, usage type <code>USW1-CapacityBlockFee:p5en.48xlarge</code>: 199,914.62 USD upfront for one p5en.48xlarge with 8 H200, 2026-06-04 to 2026-12-03, 4,368 h). It covers the GPU node only, and the block ends 2026-12-03. Modal utilization is busy seat time over billed container time. Refreshed on each daily run.

| App | Region | Before | After | Change | Modal utilization, before | Modal utilization, after | After window | Verdict |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| <b>Maverick</b> | All regions | 0.66 | 0.51 | -23% | 3.6% | 3.1% | 11-06 to 11-18 | Cheaper |
| Maverick | US | 0.60 | 0.41 | -31% | 2.7% | 2.7% | 11-06 to 11-18 | Cheaper |
| Maverick | EU | 1.05 | 1.17 | +11% | 4.8% | 2.5% | 11-17 to 11-18 | Costlier |
| <b>R-1 (pages)</b> | All regions | 3.73 | 2.21 | -41% | 4.0% | 2.9% | 11-09 to 11-18 | Cheaper |
| R-1 (pages) | US | 3.09 | 1.94 | -37% | 5.2% | 4.2% | 11-09 to 11-18 | Cheaper |
| R-1 (pages) | EU | 35.42 | 4.94 | -86% | 0.7% | 1.8% | 11-17 to 11-18 | Cheaper |
| <b>R-1 mini (pages)</b> | All regions | 2.21 | 2.16 | -2% | 4.8% | 2.9% | 11-09 to 11-18 | No verdict: volume-driven |
| R-1 mini (pages) | US | 1.62 | 1.35 | -17% | 6.3% | 4.2% | 11-09 to 11-18 | No verdict: volume-driven |
| R-1 mini (pages) | EU | 71.86 | 30.64 | -57% | 0.9% | 1.8% | 11-17 to 11-18 | Cheaper |
| R-1 mini (pages) | AU | 24.15 |  |  | 1.1% |  |  | Not on the router |
| <b>Citation 7B</b> | All regions | 2.28 | 2.51 | +10% | 6.0% | 5.0% | 11-17 to 11-18 | Costlier |
| Citation 7B | US | 2.11 | 2.23 | +6% | 6.3% | 5.5% | 11-17 to 11-18 | Costlier |
| Citation 7B | EU | 4.47 | 6.98 | +56% | 3.7% | 2.2% | 11-17 to 11-18 | Costlier |
| <b>FigSum</b> | All regions | 1.09 | 1.50 | +38% | 7.6% | 3.0% | 11-17 to 11-18 | Costlier |
| FigSum | US | 0.90 | 1.17 | +29% | 7.8% | 3.7% | 11-17 to 11-18 | Costlier |
| FigSum | EU | 1.51 | 2.50 | +65% | 7.4% | 2.1% | 11-17 to 11-18 | Costlier |
| <b>Magpie</b> | All regions | 14.54 | 7.10 | -51% | 3.5% | 14.3% | 11-17 to 11-18 | Cheaper |
| Magpie | US | 10.51 | 4.98 | -53% | 4.8% | 21.3% | 11-17 to 11-18 | Cheaper |
| Magpie | EU | 101.77 | 36.71 | -64% | 0.5% | 1.1% | 11-17 to 11-18 | Cheaper |
| <b>Triton core vision</b> | All regions | 1.67 | 1.23 | -26% | n/a | n/a | 11-14 to 11-18 | Cheaper |
| Triton core vision | US | 1.37 | 1.00 | -27% | n/a | n/a | 11-14 to 11-18 | Cheaper |
| Triton core vision | EU | 8.75 |  |  | n/a |  |  | Not on the router |
| <b>Qwen RF-DETR</b> | All regions | 0.75 | 0.42 | -44% | n/a | n/a | 11-14 to 11-18 | Cheaper |
| Qwen RF-DETR | US | 1.04 | 0.56 | -46% | n/a | n/a | 11-14 to 11-18 | Cheaper |
| Qwen RF-DETR | EU | 0.38 |  |  | n/a |  |  | Not on the router |
| <b>Change tracking</b> | All regions | 1.41 | 3.59 | +155% | n/a | n/a | 11-17 to 11-18 | Costlier |
| Change tracking | US | 1.05 | 2.82 | +170% | n/a | n/a | 11-17 to 11-18 | Costlier |
| Change tracking | EU | 190.58 |  |  | n/a |  |  | Not on the router |
| <b>Highlight detection</b> | All regions | 3.99 | 2.25 | -44% | n/a | n/a | 11-17 to 11-18 | Cheaper |
| Highlight detection | US | 3.02 | 1.78 | -41% | n/a | n/a | 11-17 to 11-18 | Cheaper |
| Highlight detection | EU | 76,876.76 |  |  | n/a |  |  | Not on the router |

<image source="notion-file-block://41d4a78a-1c87-8144-82ef-ff8eb8f6f3ec/31377ef8-f9d8-4c5c-bc0d-4b0e614cd7c0?space_id=4bcae9ff-d0ea-416d-b2f5-a9d6be0a2ecc&name=router_cost_before_after_2026-11-19.png">
Cost per 1k ok calls before and after the router move, all regions and US, and Modal utilization, with the change per app
</image>

Caveats:

- Regions: cost is split by Modal environment, calls by caller environment. Cluster GPUs are US only. A region with no Modal bill for an app (AU, for all but R-1 mini) is served by the US apps and counts with US.
- "Costlier" rows have two days of router traffic (11-17 and 11-18), and the Modal bill is an estimate for 11-18. FigSum is costlier at equal volume: its Modal app billed 220 GPU-hours a day against 151, at 3.0% utilization against 7.6%. Citation 7B in the US cost 1.85 on 11-18, its first full day in slots mode, below its 2.11 before; in the EU it billed 514 USD on 11-18 against about 200 a day before. Change tracking is mostly volume: 198k and 120k calls against 183k to 273k on weekdays before, with a fixed 137 USD a day of usw1. Maverick EU has no cluster GPUs, so only its Modal bill moves. Details: [Inference footguns](https://app.notion.com/p/41b4a78a1c8781e88b9eedaaf8354377) log of 2026-11-19.
- R-1 mini: pages fell 15x on 11-04 (2.7M to 0.14M a day), five days before the move. All regions it cost 1.60 at the high volume (10-28 to 11-03), 18.50 at the low volume (11-04 to 11-08) and 2.16 after the move. The load-test floors of [#15054](https://github.com/reductoai/api/pull/15054) and [#15191](https://github.com/reductoai/api/pull/15191) are planned spend and sit in its Modal bill.
- Modal utilization did not rise with the move (Maverick 3.6% to 3.1%, fpp-flash 4.0% to 2.9%). The saving comes from billing fewer Modal container hours as calls moved to cluster GPUs: fpp-flash 2,336 to 987 paid GPU-hours a day, Maverick 575 to 343.
- Modal utilization takes each Modal app whole, so R-1 and R-1 mini share the fpp-flash number. Triton has none: calls through the router or to usw1 write no call rows.
- Triton rows count calls from the client metric in Datadog and split the two segmentation GPUs of usw1 evenly between change tracking and highlight detection. EU Triton is not on the router; its change tracking and highlight detection apps are almost idle.
- Before windows start 10-20 (R-1 mini 10-28, Magpie 11-06) and end the day before the region's first router day (Triton core vision and Qwen RF-DETR: 11-12).
- Sources and queries: [Inference footguns](https://app.notion.com/p/41b4a78a1c8781e88b9eedaaf8354377) log of 2026-11-17.

### Impact

- Citation 7b in US: 100% of calls on the router, no fallbacks. Measured in prod.
- table\_ensemble: 1,475 fallbacks vs 5,504 ok, 0 router errors in 6 h. Measured from router pod logs, 2026-11-18 (Mary).
- table\_ensemble fallbacks in Datadog were overcounted about 50x: 1,999 at 23:00 PT Nov 18 were really 39 (cumulative counter merged across pods; [#15392](https://github.com/reductoai/api/pull/15392) fixes it).
- Fixed with the 10:14 PT Nov 19 prod release (Datadog, read 2026-11-19 15:00 PT): table\_ensemble, 11:00 to 15:00 PT: EU 13 in Datadog against 15 real, US 10 against 11. Before, 07:00 to 10:00 PT: EU 1,908 against 23, US 2,870 against 24. The 3 still missing are not explained.
- EU Triton ramp, fallbacks to direct Modal and EU Triton Modal spend per step (prod, read 2026-11-19 10:20 PT): 25%: 6 of 6,508 calls, spend not measured. 50% (16:57 Nov 18 to 01:32 Nov 19 PT): 18 of 51,073; 528 USD for 17:00 to 01:00 against 520, 498, 470 the days before. 100% (01:36 to 09:32 PT Nov 19): 57 of 606,802 (0.009%); 941 USD for 02:00 to 10:00 against 710, 696, 715. No failed job.
- Fallbacks at 100%: Citation 7B EU 0 of 1,354 calls, Magpie EU 0 of 3,676, change tracking 1 of 9,642, highlight detection 8 of 10,797 (usw1 500s, each served by direct Modal). EU Triton at 50%: 18 of 51,073 (0.04%).
- Cost per 1k ok calls or pages, Modal bill plus cluster GPUs, all regions, before to after the move (Jensen's daily router cost read, data through Nov 18, from the inference-health page's loaders, read 2026-11-19): R-1 3.73 to 2.21 USD per 1k pages (-41%), Magpie 14.54 to 7.10 (-51%), Maverick 0.66 to 0.51 (-23%), Qwen RF-DETR 0.75 to 0.42 (-44%), highlight detection 3.99 to 2.25 (-44%), Triton core vision 1.67 to 1.23 (-26%).
- Triton core vision's drop rests on the weekend: US weekdays cost 1.51 and 1.44 against 1.37 before.
- R-1 mini 2.21 to 2.16: no verdict yet.
- R-1 queue-aware autoscaler ([#15187](https://github.com/reductoai/api/pull/15187), live Nov 17 evening), 06:00 to 14:00 PT, load-test and shadow orgs excluded (Datadog, read 2026-11-19 15:00 PT). Workers started, startup p50 / p90, Modal share, direct Modal calls: Nov 13 43, 180 s / 320 s, 1.40%, 0; Nov 16 38, 300 s / 340 s, 2.14%, 0; Nov 17 18, 40 s / 280 s, 0.39%, 61; Nov 19 (after) Modal share 0.32% on 3.53M calls, 411 direct.
- Nov 19 startup is not comparable: since [#15259](https://github.com/reductoai/api/pull/15259) R-1 is a fixed baseline of 16 workers plus a burst pool. Burst pool on use1 and uss1: 40 workers started, p50 280 s / p90 1,180 s including the wait for a GPU, 55 asked for and never ready. Burst pods waited for a GPU in 69 of 80 five-minute periods on use1 and 56 of 96 on uss1 (B200 pool full at 22 R-1 workers per cluster).
- The 411 direct Modal calls are router fallbacks, 248 of them after a 529 from a burst worker. Cause and fix: step 4 of [R-1 routing in shadow](https://app.notion.com/p/41a4a78a1c8780be9c83d3f02a810d07), waiting on Jean's stamp.
- Change tracking 1.41 to 3.59 USD per 1k calls: mostly higher volume, not a router regression (Jensen); his fix doesn't cover it.
- Modal spend: paid Modal GPU-hours a day went from 2,336 to 960 for fpp-flash and from 575 to 334 for Maverick. EU R-1 and R-1 mini floors went from 6 and 5 to 1 ([#15004](https://github.com/reductoai/api/pull/15004)): about 6.2 B200s, about \$28k a month by floor size, not read from the bill.
- Modal utilization (busy seat time over billed container time) did not rise: Maverick 3.6% to 3.0%, fpp-flash 4.0% to 2.4%.

### AU R-1 mini router (Logs)

- PR 1, router namespace <code>fpp-2b</code> and controller, no caller: [#15424](https://github.com/reductoai/api/pull/15424) ✅. Scalr applied prod-au eks-addons by itself at the merge.
  - Router installed in au-prod ([run](https://github.com/reductoai/api/actions/runs/44627515909)); smoke test fails with 504, no cap until the controller runs.
  - AU app deploy failed: the release checked for the controller's Secret 2 minutes before the Scalr apply finished. AU app stays on the previous release.
- PR 2, callers at 0% with own flag: [#15428](https://github.com/reductoai/api/pull/15428) clean on main, ready for the merge. Also stops the gate reading the prod\_au of every AU session as a replay pin.
- Citation 7b (all regions):

### AU R-1 mini router (restored)

- AU R-1 mini
  - Jean: re-run the failed AU job of the [prod release](https://github.com/reductoai/api/actions/runs/44627380051), so the AU controller starts
  - Jean: merge [#15461](https://github.com/reductoai/api/pull/15461) and check its Scalr apply of prod-au eks-addons: AU router on xlarge nodes with 1 CPU pods, about 89 → 22 USD a day
  - Devin: re-run the au-prod router deploy for a green smoke test, check router and controller on the cluster
  - Jean: merge [#15428](https://github.com/reductoai/api/pull/15428) (safe now, share stays 0), then ramp 10 → 25 → 50 → 100 in Sydney business hours. Kill switch: <code>inference_modal_only</code>.
  - PR 3: controller owns the floor (slots mode), cron schedule removed
    - Floor is Jean's call after a week at 100%: keep 3 on Sydney weekdays (saves nothing) or 1 as in EU.
  - Expected savings: 0 to 80 USD a day
    - AU bills 234 USD a day, all of it R-1 mini: 26.7 USD per 1k pages, 8.8k pages a day (Nov 12 to 18).
    - 80 USD a day is the weekday floor 3 → 1 (150 container-hours a week at 3.74 USD). Bursts already hit the 120 s deadline at p99 (Nov 18), so floor 1 may not hold.
    - This move gives AU the same path as US and EU. It is not for the bill.
  - Scope: R-1 mini only
    - AU Maverick, Triton, Magpie, Citation and ordering calls (about 7k a day) run on the US Modal apps and bill with US. They stay direct. No cross-region lending.
  - Measure: 7 days before the ramp, 7 days at 100%, 7 days after PR 3
    - USD per 1k pages, Modal USD a day, p99, router fallbacks, Gemini fallbacks (2.4% today), utilization.

### AU R-1 and R-1 mini on H100s (plan, waiting for Jean's stamp)

<b>Ask: stamp this plan, or overrule any of the three defaults at the end.</b>

Problem: AU serves one model, R-1 mini 0928 INT8 on H100/H200 (<code>Fpp2BInt8FlashServer</code>, Modal prod\_au). Every AU page runs on it, even jobs that ask for R-1.

Fix: serve both models from the role classes, as US and EU do: R-1 on <code>R1</code>, R-1 mini on <code>R1Mini</code>. Both packages are in the registry, unpicked.

| Model | Package | 1x H100, measured 2026-11-17 | Judge net |
| --- | --- | --- | --- |
| R-1 | <code>h100-fp8-tp1</code> | 2.84 pages/s at 16 in flight, p50 3.9 s, p90 8.6 s, 0.387 USD per 1k pages | -5 vs prod <code>b200-1112-20</code> (bar -30) |
| R-1 mini | <code>20261117-h100-int8</code> (RL 299) | 12.94 pages/s at 32 in flight, p50 1.8 s, p90 3.8 s, 0.085 USD per 1k pages | -3 vs RL 299 on B200 |

Why it fits: R-1 mini matches today's AU package in the same container (12.74 pages/s, 0.086 USD per 1k pages), and R-1 sits well inside its bar. R-1 on H100 costs 3.0 times a B200 page (0.131 USD). Tables: <code>registry/models/r1.md</code>, <code>r1_mini.md</code>.

- Step 1, deploy PR, no traffic: pick both packages in <code>modal/prod_au</code> at floor 0. Nothing in AU calls <code>R1</code> or <code>R1Mini</code> yet. README marks both as current prod\_au packages.
  - R-1 keeps <code>H100!</code>. One dev probe in AU got an H100 in 145 s; <code>[H100, H200]</code> got one in 4 s. If AU H100s run short, R-1 queues rather than land on an unmeasured H200.
- Step 2, smoke test: one real page through each prod\_au class once the release deploys it.
- Step 3, cutover PR, stacked on AU router PR [#15428](https://github.com/reductoai/api/pull/15428): the AU <code>r1:</code> section sends <code>small</code> to <code>R1Mini</code> and <code>large</code> to <code>R1</code>, floors move to the new classes, and the AU controller counts both.
- Step 4, cleanup PR: zero the old <code>Fpp2BInt8FlashServer</code> AU floor once the new classes hold a week.
- Rollback: revert the cutover PR. The old class keeps its floor until step 4.
- Defaults unless you overrule
  - R-1 mini moves to the RL 299 weights now, not a 0928 re-host.
  - R-1 AU floor: 1 warm H100 on Sydney weekdays 05:00 to 20:00 (10:00 to 01:00 PT now, Sunday to Thursday; 12:00 to 03:00 PT in the Sydney winter), 0 otherwise, about 1,280 USD a month. A cold start from the snapshot answers in 100 s.
  - AU jobs that ask for R-1 run on R-1 at cutover: 0.387 USD per 1k pages, 4.5 times today's R-1 mini answer (0.086 USD).
- Not in this plan: lending, Terraform, prod Doppler, and the prod release itself (Jean's).

### FigSum slots (Impact)

- Regressions (same read): FigSum 1.09 to 1.50 USD per 1k calls, because the router keeps \~4.4 US and 3.2 to 3.6 EU containers ready vs the old 1 + 1; Citation 7B EU \~200 to 514 USD a day (all regions 2.28 to 2.51 per 1k calls). Jensen has a fix PR started.

### FigSum slots (restored)

- EU burst (Nov 18 09:13): 1,500 calls queued 2 min after a FigSum redeploy, ready stayed at 1 for 3 min, 2,188 admit-deadline fallbacks. Cold start after a redeploy, not fixed.
- Spare container (controller buffer 1), US and EU: [#15336](https://github.com/reductoai/api/pull/15336) ✅ + Deploy (Nov 18 17:39 release). Nov 19, 06:00 to 14:00: ready = target + 1 in 374/480 min (US) and 392/479 (EU); calls waiting over 5 s 1.0% (US) and 2.0% (EU); 1 admit-deadline fallback per region. Cost: about 300 USD a day for both regions vs no spare, about 131 vs the cron (B200 at 6.25 USD/h, GPU only).
- Rollout dashboard

### EU core CV (Logs)

- 50% (Nov 18 16:55 PT, Jean's go), held through EU morning to 01:32 PT: 51,073 routed calls, 18 fallbacks (0.04%, core CV calls the Modal container rejected as overloaded; direct Modal served them, jobs completed). Admit wait p99 1.7 s, max 7.8 s on core CV. App spend \$528 for 17:00 to 01:00 PT vs \$520 the same hours a day earlier.
- <b>Triton core CV / Qwen RF-DETR:</b> routing ✓ [#14314](https://github.com/reductoai/api/pull/14314) → capacity ✓ [#14766](https://github.com/reductoai/api/pull/14766) → floor cutover ✓ [#14898](https://github.com/reductoai/api/pull/14898) (deployed 11/16).
  - Qwen queue fix [#14893](https://github.com/reductoai/api/pull/14893) ✅ merged.
- Core CV orders fewer burst containers: [#15426](https://github.com/reductoai/api/pull/15426) ✅ (Nov 19 13:40 PT), ships with the next prod release.
- Figsum

### EU core CV (Impact)

- EU core CV at 100%, 02:00 to 10:00 PT Nov 19 against Nov 18: calls +54% (337,338 against 219,009), ready containers +105% (7.6 against 3.7), so about a third more containers per call. Most of the spend rise is traffic. Fix: [#15426](https://github.com/reductoai/api/pull/15426), merged Nov 19, not in prod yet (replay: 8.2 to 3.7 ready containers; waits over 5 s 0.09% to 0.41%, uncertain).
- Admit wait p99: Citation 7B US 2.4 s to 866 ms with slots mode ([#15050](https://github.com/reductoai/api/pull/15050)). After only: Magpie US 7 ms, Citation 7B EU 2.8 s on 6 seats, EU Triton core CV 1.7 s at 50%.

### EU core CV (restored)

- EU Triton
  - After the prod release with #15426: compare core CV ready containers and waits over 5 s with the replay
  - Slots mode once 100% holds
