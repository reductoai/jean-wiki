# Inference footguns

Static sweep of reductoai/api @ 4df0566ccd (code and config only, no telemetry or PostHog values read). 8 findings, ranked by impact x confidence.

{{dashboard:inference-footguns}}

## Details

<details>
<summary>Plan</summary>

Static sweep of reductoai/api @ 4df0566ccd (code and config only, no telemetry or PostHog values read). 8 findings, ranked by impact x confidence.

- Fixing now
  - (1) Autoscaler queue signal: the KEDA trigger is <code>dynamo_frontend_active_requests</code> per worker against <code>activeRequestsTarget</code>, so it tops out at seats / target (1.25x for R-1 35B, 1.375x for Maverick) however deep the router queue is
    - Fix: add the router's admit queue to the trigger (in-flight plus queued per worker)
  - ✅ (2) Router share defaults, done in [#15184](https://github.com/reductoai/api/pull/15184): Triton, Magpie, citation 7B and FigSum are <code>share_pct: 0</code> in <code>router.prod.yaml</code>, the live share exists only in PostHog, so a missing value or a pod that cannot read the flag store sends them 100% to Modal with no log
    - Fix: commit each ramped share as the YAML default (as Maverick and R-1 already do at 100), PostHog stays the override
  - (3) <code>dfine_table_model</code> batching benchmark: the cluster build is forced to batch 1, delay 0, while checkbox runs batch 10 on cluster and batch 1 on Modal
    - Fix: benchmark batch > 1 on H200, or record why batch 1 is required
  - ✅ (5) FallbackBackend, done in [#15185](https://github.com/reductoai/api/pull/15185): falls through on any exception, so a deterministic input error on Modal runs again on the CPU LOCAL\_SERVICE; only a <code>logfire.warn</code>, no counter
    - Fix: no fall-through on non-retryable error types, count fallbacks by method and backend
  - ✅ (8) together-inference delete, done in [#15182](https://github.com/reductoai/api/pull/15182): <code>together-inference/</code> looks dead (static <code>replicas: 13</code>, <code>deploy/models</code> last changed 2026-02, no prod code references it)
    - Fix: confirm it is retired, delete the directory
- Not fixing now
  - (11) Watch, no fix proposed: a Dynamo frontend answers 404 during a worker rollout while its <code>/capacity</code> still reports seats. Maverick on <code>gcp_usw3</code>, 2026-11-19 07:31 PT: 300 of 1,896 calls in one minute got 404 as the cap went 192 to 48 to 144; each went to Modal. 12 more on <code>gcp_uss1</code> the hour of 22:00 PT Nov 18. A 404 is not a fault for the down flag
  - (4) Down flag needs 20 results and 50% errors per router pod: a cluster failing under half its calls never trips, low-traffic namespaces never reach 20 results per pod (known tradeoff)
  - (6) Triton call budgets stack: 45 s cluster, then a fresh 45 s for Modal, then LOCAL\_SERVICE, instead of one shared deadline (documented)
  - (7) AU drift: AU serves 2B <code>int8_20261019</code> against <code>nvfp4_20261023</code> in US and EU, and 3 to 6 AU router pods serve nothing (no AU route)

</details>

<details>
<summary>Modal ingress limit: split any Modal server (R-1 mini first) (finding 10)</summary>

<b>Ask: Jean's stamp.</b> Nothing is built. The plan is on its own page: <a href="https://app.notion.com/p/41d4a78a1c87818182cbf2c3fea40d32">Modal ingress limit: split any Modal server (R-1 mini first)</a>

</details>

<details>
<summary>Logs</summary>

- \[2026-11-17 14:28 PT\] Sweep done, 8 findings. Fixes picked: 1, 2, 3, 5, 8. No PRs yet.
- \[2026-11-17 14:43 PT\] Finding 8: [#15182](https://github.com/reductoai/api/pull/15182) ✅ merged by Jean. Deletes the retired <code>together-inference/</code> directory.
- \[2026-11-17 14:47 PT\] Finding 5: [#15185](https://github.com/reductoai/api/pull/15185) ✅ merged by Jean. <code>FallbackBackend</code> fails at once on <code>InputError</code> and <code>ProcessingError</code> instead of trying the next backend, and counts fallbacks in <code>reducto.inference.backend_fallbacks</code> by method, backend and error type.
- \[2026-11-17 15:20 PT\] Finding 9 added from the Basis burst of 14:52 to 14:54 PT (Tinybird traces and controller gauges): the admit-deadline spill put about 1,340 requests on 3 Modal R1 containers in 20 s, median 135 s in vLLM's queue, 942 cancelled at 97 s. Scale-up fired (15 containers by 14:55:07 PT) but after the wave and at the <code>drain_s</code> size. Fix (a) or (b) is Jean's pick.
- \[2026-11-17 15:35 PT\] Finding 9 fix (c): [#15195](https://github.com/reductoai/api/pull/15195) open. The R1 wrapper cancels a buffered completion when its caller disconnects; before, FastAPI kept the handler running and vLLM generated the page for nobody.
- \[2026-11-17 15:42 PT\] Found while measuring for #15185: [#15188](https://github.com/reductoai/api/pull/15188) ✅ merged by Jean. The consolidated Triton client caps every wire request at 256 images, so a predict over the limit splits instead of failing with <code>InvalidConfigError</code> (279 images go out as 256 + 23). Not deployed yet.
- \[2026-11-17 15:45 PT\] Finding 2: [#15184](https://github.com/reductoai/api/pull/15184) ✅ merged by Jean. The YAML <code>share_pct</code> of every namespace with its own PostHog share value is now the live value, 100 for all 12 (US: the 4 Triton pools, Magpie, citation 7B, FigSum; EU: FigSum, Magpie, citation 7B, R-1, R-1 mini, maverick), and a missing value warns <code>inference_router.missing_share</code> once a minute per flag per process. No deploy by the session: it takes effect with the next prod release.
- \[2026-11-17 15:47 PT\] Finding 9 fix (c): [#15195](https://github.com/reductoai/api/pull/15195) ✅ approved by Jean and merged. Not live until the next <code>fpp-flash</code> deploy; then check on stg that a cancelled call logs <code>fpp.request.abandoned</code> and leaves no <code>llm_request</code> span past the cancel. Fix (a) or (b) is still Jean's pick.
- \[2026-11-17 16:27 PT\] Finding 9: Jean keeps the spill as it is (no cap, no Modal pre-sizing), so (a) and (b) are dropped. Cluster path checked for the same bug, no fix needed: the router stops the provider call when the worker hangs up (<code>TestAWorkerThatHangsUpStopsTheProviderCall</code>), and the Dynamo 1.5.1 worker in the running prod image aborts the vLLM request when its context is stopped (<code>dynamo/vllm/handlers.py</code> <code>_monitor_abort</code>). On prod-gpu-use1 since its pods started 4 days ago: 9 <code>dynamo_frontend_disconnected_clients</code>, 9 frontend requests with <code>error_type=cancelled</code>, 9 worker <code>dynamo_component_cancellation_total</code> on <code>generate</code>, in 4.09M requests. Not observed: a GPU seat freed by a dropped call (no stg or dev GPU cluster; would need one test page on a prod cluster). The stg check of the Modal fix still waits on the next <code>fpp-flash</code> deploy.
- \[2026-11-17 16:30 PT\] Finding 9 fix (c) checked on stg (<code>fpp-flash</code> v181, has [#15195](https://github.com/reductoai/api/pull/15195)): ✅ pass. 5 long pages dropped 3 s in: 5 <code>fpp.request.abandoned</code>, no <code>llm_request</code> span for any of them. 24 dropped at once (20 running, 4 queued in vLLM): 24 abandoned, running and waiting counts at 0 within 1.2 s of the drop, no <code>llm_request</code> span. Control page with the caller connected: 200, 15,561 tokens in 7.7 s. Before the fix (v180) the same 5 dropped pages each ran 10 to 11 s to the end. vLLM's abort counter stayed 0 and I read no abort log line. Prod <code>fpp-flash</code> v135 (16:25 PT) has the fix; no Modal R-1 call has been dropped there since, so nothing to confirm in prod yet.
- \[2026-11-17 17:50 PT\] R-1 35B A100 80GB profile (<code>a100-fp8-tp1</code>): [#15230](https://github.com/reductoai/api/pull/15230) open. Adds the 1, 8 and 16 in-flight rows, measured on one A100 80GB on Modal dev with the arm 05 recipe (memory 0.92): 0.39, 1.00 and 1.13 pages/s, p50 2.0, 6.1 and 10.1 s, 1.772, 0.696 and 0.612 USD per 1k pages, 0 errors. Adds the recipe <code>vllm-35b-fp8-a100</code> and a dev-only Modal host; no pick names it, so nothing deploys. Not tested: a full R1 boot through fpp-flash on an A100.
- \[2026-11-17 18:19 PT\] R-1 35B single-H100 profile (<code>h100-fp8-tp1</code>, FP8 weights, no TP2): [#15237](https://github.com/reductoai/api/pull/15237) open. Adds the recipe <code>vllm-35b-h100-fp8</code> and a Modal host (<code>H100!</code>, dev and prod\_au); no pick names it, AU untouched. Re-measured on one H100 on Modal dev with the tuned MoE config: 0.69, 2.32, 3.07, 3.13, 3.19, 3.14 and 3.15 pages/s at 1, 8, 16, 32, 48, 64 and 96 in flight, p50 1.1, 2.6, 3.9, 8.7, 13.6, 18.7 and 28.8 s, 0 errors; 0.357 USD per 1k pages at 16 in flight against 0.131 for the B200 1112 package (13.26 pages/s). Judge against 1112 on rep-1k: 7 wins, 981 ties, 12 losses, net -5 (bar -30). A dev shadow built from the branch served a page on an H100 and restored from its GPU snapshot in 100 s; it is stopped. Not checked: H100 capacity in Modal AU.
- \[2026-11-17 20:30 PT\] R-1 35B single-H100 profile, re-measured with the shared AIPerf runner (rep-1k, 180 s per level, dev shadow of the R1 class held at one container, load through the Modal proxy): 0.68, 2.11, 2.84, 3.05, 3.00, 3.00 and 3.09 pages/s at 1, 8, 16, 32, 48, 64 and 96 in flight; p90 2.5, 5.7, 8.6, 14.0, 18.5, 23.9 and 33.8 s; 0 errors. The gate (p90 at most 10 s, no error) passes up to 16 in flight: 0.387 USD per 1k pages, 3.0 times the B200 1112 package. The table in [#15237](https://github.com/reductoai/api/pull/15237) now comes from this run. The runner gained <code>--header-env</code> so it can reach an fpp-flash shadow. The dev app is stopped.
- \[2026-11-17 21:35 PT\] R-1 35B single-H200 profile, [#15249](https://github.com/reductoai/api/pull/15249) open (variant <code>h200-fp8-tp1</code>, a measurement record: no recipe or host). The H100 FP8 TP1 package unchanged on one H200, shared AIPerf runner inside the container on [localhost](http://localhost), rep-1k, 1,000 requests per level, one run per level: 0.79, 2.66, 3.45, 3.70, 3.86, 3.95, 4.07, 4.35, 4.28 and 4.37 pages/s at 1, 8, 16, 20, 24, 28, 32, 48, 64 and 96 in flight; p90 2.1, 4.9, 7.8, 8.8, 10.3, 11.8, 12.9, 18.1, 21.8 and 29.1 s; 0 errors. The gate (p90 at most 10 s, no error) passes up to 20 in flight: 0.341 USD per 1k pages at 4.54 USD per hour, 2.6 times the B200 1112 package. At 16 in flight it is 3.45 pages/s and 0.365 USD per 1k against the H100's 2.84 and 0.387 (different load path: the H100 rows went through the Modal proxy). Judge against B200 BF16: 14 wins, 978 ties, 8 losses, net +6. More KV memory, FP8 KV and BF16 weights were screened on the workstream's old load loop only and gave no gain; the gate breaks on latency before the KV cache fills. The first table in this PR came from that old loop (4.61 pages/s peak at 64 in flight, outside the gate) and was replaced. Both dev apps are stopped.

</details>

<details>
<summary>2026-11-17 16:55 PT, daily router cost read (first run, partial)</summary>

- Scope: 10 router apps. Modal side measured for all; cluster GPU cost and the inference-health page COGS not read (Datadog keys on the VM and in Doppler <code>dev_alex</code> return 403; the page refuses the session sign-in with <code>requester_not_allowed</code>). Asked Xavier for access.
- Modal spend per 1k ok calls or pages, before vs after the move (Modal bill final through 11-15): Maverick 0.44 to 0.35; R-1 2.75 to 1.17; R-1 mini 1.40 to 4.81 (volume fell about 9x, Modal spend only halved).
- Citation 7B, FigSum, Magpie, change tracking, highlight detection: first router grants on 11-17, baseline recorded, no verdict yet.
- Triton calls served by usw1 write no <code>model.call</code> span and the snapshot counts no usw1 cost, so the page's Triton families are Modal only and read too high after the move.
- On 11-17 the router sent about half of core CV and two thirds of Qwen RF-DETR grants to Modal, not usw1.
- Sources: Snowflake <code>EXTERNAL_APPS.MODAL.MODAL_USAGE_DAILY</code> plus the Modal billing API; Tinybird <code>otel_model_call_mv</code> (<code>countMergeIf(call_count, outcome = 'ok')</code>); Tinybird <code>otel_metrics_sum</code> <code>router.grants</code> by namespace and cluster; family mapping from <code>cloudflare/inference-health-internal/snapshot/config.yaml</code>. Scripts and exact queries: bot memory <code>files/router-cost-daily/README.md</code>.
- No code change, no PR.

</details>

<details>
<summary>2026-11-17 17:20 PT, daily router cost read (first run, full)</summary>

- Cluster GPU cost added from Datadog (Jean's personal access token, Doppler <code>dev_jean</code>, read only). Rate 5.50 USD per GPU-hour for B200 and usw1 H200. Modal bill is final through 11-15; 11-16 and 11-17 are Modal API estimates.
- USD per 1k ok calls or pages, before to after the move, Modal + cluster:
  - Maverick 0.66 to 0.55 (after 11-06..11-17)
  - R-1 3.73 to 2.25 (after 11-09..11-17)
  - R-1 mini 2.21 to 4.62 (after 11-09..11-17): regression, volume fell from 1.6M to 0.5M pages a day while cost fell from 3.6k to 2.3k USD a day
  - Triton core vision, US 1.35 to 0.84 (after 11-14..11-17)
  - Qwen RF-DETR, US 1.03 to 0.61 (after 11-14..11-17)
  - One estimated day of router traffic (11-17), no verdict: Citation 7B 2.28 to 2.71, FigSum 1.09 to 1.30, Magpie 14.54 to 7.31, change tracking 1.03 to 1.50, highlight detection 2.95 to 1.19
- inference-health page gaps: Triton calls through the router or to usw1 write no <code>model.call</code> row and usw1 GPU cost is not counted, so its Triton families are wrong after the move; the family regexes miss the Dynamo workloads <code>fpp-2b-tiered</code>, <code>fpp-2b-snapshot</code> and <code>fpp-35b-snapshot</code>, so R-1 mini reads 4.05 where 4.62 is right.
- Sources added: Datadog <code>kubernetes_state.deployment.replicas_available</code> (dynamo-serving workers; usw1 <code>triton-*</code> deployments) and <code>reducto.triton_flash.client_http_attempts</code> (ok, by environment, target host, model). Scripts and exact queries: bot memory <code>files/router-cost-daily/README.md</code>.
- Not done: live PostHog shares not read; the page's own COGS not read (sign-in refused), recomputed with its loaders and config instead. No code change, no PR.

</details>

<details>
<summary>2026-11-17 17:30 PT, daily router cost read (first run, follow-up)</summary>

- Correction: R-1 mini is not a router regression. Its pages fell 15x on 11-04, five days before the move; USD per 1k pages was 1.60 at the high volume, 18.50 at the low volume just before the move, 4.62 after it. The load-test floors of #15054 and #15191 are planned spend (Jean).
- The table and graph now live on the router migration page, per region and for all regions, with Modal utilization before and after: [Cost per call, before vs after the router](https://app.notion.com/p/4164a78a1c87818ea15bdef76227228c). usw1 H200s are priced at 7.09 USD per GPU-hour (cogs skill).
- Modal utilization did not rise with the move (Maverick 3.6% to 3.0%, fpp-flash 4.0% to 2.4%); the saving is fewer billed Modal container hours as calls moved to cluster GPUs.
- [#15212](https://github.com/reductoai/api/pull/15212): inference-health family patterns now take <code>fpp-2b-tiered</code>, <code>fpp-2b-snapshot</code> and <code>fpp-35b-snapshot</code>, with a test that reads the live Dynamo graphs from the Helm cluster values. Open, CI green.
- Left for a follow-up: the efficiency view's R-1 summary still misses the tiered and snapshot workers (<code>renderR1</code>, <code>_clusters</code> in <code>efficiency.py</code>).

</details>

<details>
<summary>2026-11-17 17:50 PT, daily router cost read (first run, second follow-up)</summary>

- usw1 H200s are now priced at 5.721 USD per GPU-hour, not 7.09: AWS Cost Explorer, May 2026, usage type <code>USW1-CapacityBlockFee:p5en.48xlarge</code>, 199,914.62 USD upfront for capacity block cr-0d9e87335cf324c07 (one p5en.48xlarge, 8 H200, 2026-06-04 to 2026-12-03, 4,368 h). GPU node only; the block ends 2026-12-03. The 7.09 in the cogs skill is a GCP stand-in rate.
- With that rate, US: Triton core vision 1.37 to 0.85, Qwen RF-DETR 1.04 to 0.62, change tracking 1.05 to 1.53 and highlight detection 3.01 to 1.21 (both one day, no verdict). Table and graph refreshed on the [router migration page](https://app.notion.com/p/4164a78a1c87818ea15bdef76227228c).
- [#15226](https://github.com/reductoai/api/pull/15226): the efficiency view's cluster rows now fold the workers of every Dynamo graph into the namespace it serves, so the R-1 summary counts the tiered and snapshot GPUs; snapshot pilots are paid but never busy. Seats were already keyed by namespace (<code><modelKey>-dynamo-load-summary</code>). Open, CI green, Codex clean.
- Left open: <code>_clusters</code> has no row-level test (it reads Datadog and Tinybird).

</details>

<details>
<summary>2026-11-17 18:05 PT, Modal share alert fired for prod_eu fpp-2b</summary>

- [#15233](https://github.com/reductoai/api/pull/15233): the 50% monitor and its 65% <code>triton-qwen-rfdetr</code> copy leave out <code>cluster:unknown</code>, so no environment is named. ✅ Approved by Jean, merged, and applied at 18:08 PT in [run-v0pg86u0ijfj11c7c](https://reducto.scalr.io/v2/e/env-v0p5qlbd4pjdjqdgj/workspaces/ws-v0p6k6p0hu0qqurf6/runs/run-v0pg86u0ijfj11c7c) (3 changed).
- The Scalr plan also updates <code>inference_router_all_clusters_down</code> (29297426), the unapplied change of [#15209](https://github.com/reductoai/api/pull/15209), not this PR. Its own run (run-v0pg85iuqtkoffh8m) was canceled at 18:07 PT when this merge queued the next one, which applied it.

</details>

<details>
<summary>2026-11-18 08:35 PT, daily router cost read</summary>

- Data through 11-17 UTC (the Modal bill for 11-17 is an API estimate), plus 11-18 00:00 to 16:00 UTC for the Modal bill and calls. Table and graph refreshed on the [router migration page](https://app.notion.com/p/4164a78a1c87818ea15bdef76227228c). No code change, no PR.
- USD per 1k ok calls or pages, all regions, before to after the move, Modal + cluster GPUs:
  - Cheaper: Maverick 0.66 to 0.55, R-1 3.73 to 2.23, Qwen RF-DETR 0.75 to 0.43, Triton core vision 1.67 to 1.13
  - One day of router traffic (11-17), no verdict: Magpie 14.54 to 7.31, highlight detection 3.99 to 1.64, Citation 7B 2.28 to 2.71, FigSum 1.09 to 1.30, change tracking 1.41 to 2.14
  - R-1 mini 2.21 to 4.79, volume-driven. On 11-17 it had 1.48M pages and cost 1.55
- R-1 cluster cost does not follow volume. The fpp-35b workers went from about 31 to about 58 B200s on 11-13 (745 to 1,400 GPU-hours a day) and stayed at 56 to 60 every hour from 11-14 to 11-17, about 7.7k USD a day. US pages cost 1.53 and 1.61 on 11-16 and 11-17 (5.3M and 5.4M pages) but 3.91 and 5.21 on 11-14 and 11-15 (2.0M and 1.5M pages). Maverick shows the same on a floor of 12 workers: 1.09 and 1.34 on the weekend against 0.34 to 0.44 on weekdays. Why the workers do not scale down was not read.
- Triton core vision: the "cheaper" verdict rests on the weekend. US cost 0.51 and 0.73 on 11-14 and 11-15 (2.5M and 1.7M calls) but 1.51 and 1.44 on 11-16 and 11-17, against 1.37 before the move. The US Modal bill of <code>TritonFlashServer</code> is 0.8k to 1.6k USD a day after the move against about 1.16k before, while the router released 88% to 98% of core vision leases to usw1. Qwen RF-DETR holds on weekdays (US 0.54 and 0.74 against 1.04).
- Citation 7B, FigSum and Magpie have no cluster workers: every <code>router.release</code> is Modal, in US and EU, so only the Modal floor can move their cost. 11-17 is inside the 11-09 to 11-13 weekday range for Citation 7B (2.71 against 2.34 to 2.96) and FigSum (1.30 against 1.01 to 1.30). Change tracking US 1.53 is inside its range too (1.15 to 1.69); its 303 USD a day is fixed, so cost follows calls.
- R-1 mini on 11-18: 1.2M pages went to Modal <code>fpp-flash</code> between 00:00 and 02:00 UTC (<code>router.release</code>: Modal 494k and 710k an hour, the three clusters 120k to 166k an hour together). It matches the load-test floor of [#15191](https://github.com/reductoai/api/pull/15191) (from 00:35 UTC), which is planned spend. US <code>fpp-flash</code> Modal bill 00:00 to 16:00 UTC: 1,886 USD against 553 for the same hours of 11-17.
- Modal bill, 11-18 against 11-17, 00:00 to 16:00 UTC, other apps: US Citation 7B 957 against 1,296, FigSum 469 against 516, Magpie 232 against 306, Maverick 584 against 478, triton-flash 2,013 against 1,975. EU Citation 7B 301 against 167 on fewer calls (28k against 62k); EU Maverick 1,116 against 899 on 15% more calls.
- Not done: the inference-health page's own COGS (sign-in refused on 11-17, not retried; recomputed with its loaders and config), live PostHog shares.
- \[2026-11-18 10:04 PT\] Finding 9 fix (c) confirmed in prod, read-only, on the Nov 17 load test spill after [#15195](https://github.com/reductoai/api/pull/15195) went live (16:25 PT): ✅ 299 direct Modal fpp-35b calls were cancelled by the worker (222 at 16:47 to 16:53 PT, 77 at 17:14 to 17:16 PT). All 299 reached the R1 wrapper; 297 logged <code>fpp.request.abandoned</code> a median 0.04 s (max 0.74 s) after the drop, and no <code>llm_request</code> for any of them ended more than 0.2 s past the drop. The other 2 had finished generating 0.15 and 0.26 s before the caller left, so there was nothing to cancel. In the Basis burst before the fix, about 750 of 942 were generated in full. Also seen: 72 of 95 cancelled R-1 mini calls on router-leased Modal seats match an abandoned event; the other 23 are not matched by my join, not checked further. Spilled pages still wait in vLLM's queue (31 and 59 s on the two I read), as expected with the spill left as it is.

</details>

<details>
<summary>2026-11-19 08:40 PT, daily router cost read</summary>

- Data through 11-18 UTC (the Modal bill for 11-18 is an API estimate), plus 11-19 00:00 to 16:00 UTC for the Modal bill and calls. Table and graph refreshed on the [router migration page](https://app.notion.com/p/4164a78a1c87818ea15bdef76227228c). No code change, no PR.
- USD per 1k ok calls or pages, all regions, before to after the move, Modal + cluster GPUs:
  - Cheaper: Maverick 0.66 to 0.51, R-1 3.73 to 2.21, Triton core vision 1.67 to 1.23, Qwen RF-DETR 0.75 to 0.42, Magpie 14.54 to 7.10, highlight detection 3.99 to 2.25
  - Costlier (two days of router traffic, 11-17 and 11-18): FigSum 1.09 to 1.50, Citation 7B 2.28 to 2.51, change tracking 1.41 to 3.59, Maverick EU 1.05 to 1.17
  - R-1 mini 2.21 to 2.16, volume-driven, no verdict. On 11-18 the US had 7.43M pages at 0.42 (load-test tiers of [#15232](https://github.com/reductoai/api/pull/15232) and [#15235](https://github.com/reductoai/api/pull/15235); 82% of <code>fpp-2b</code> releases went to Modal, 1,843 USD)
- FigSum is the one regression that holds at equal volume. US: 752k calls cost 1,108 USD on 11-18 against 739 for 748k on 11-12; 1.15M cost 1,114 on 11-17 against 879 for 1.13M on 11-11. EU: 291k cost 767 on 11-17 against 536 for 280k on 11-13. Its Modal app billed 220 GPU-hours a day against 151 and ran at 3.0% utilization against 7.6% (US 3.7% against 7.8%, EU 2.1% against 7.4%). Likely cause: since the move the controller keeps 4.3 to 4.4 containers ready in the US and 3.2 to 3.6 in the EU (<code>controller.capacity.ready</code>, daily average, 11-17 to 11-19), where the cron held 1 + 1 at peak and 1 + 0 off peak. The buffer of 1 from [#15336](https://github.com/reductoai/api/pull/15336) went live on 11-19 at 01:39 UTC and adds to it: 11-19 to 16:00 UTC cost 1.55 in the US (649 USD for 419k calls) and 1.90 in the EU.
- Citation 7B: the US is not a regression going forward. 11-17 cost 2.64 (raise mode until the 19:38 UTC release, 17.7 containers ready on average); 11-18, the first full day in slots mode ([#15050](https://github.com/reductoai/api/pull/15050)), cost 1.85 and 11-19 to 16:00 UTC 1.76, against 2.11 before. The EU is costlier: 514 USD for 40k calls on 11-18 against about 200 a day before, with 3.9 containers ready against 1.6 on 11-17. Likely cause: the EU controller sizes the pool since the EU route ([#15134](https://github.com/reductoai/api/pull/15134)) took traffic (slots mode, floor 1 in <code>config.prod_eu.yaml</code>) and holds more containers than the cron did; the mechanism is not confirmed. 11-19 to 16:00 UTC: 330 USD for 52k calls (6.40).
- Change tracking US 1.05 to 2.82 is mostly volume: 198k and 120k calls against 183k to 273k on weekdays before, and usw1 is a fixed 137 USD a day. Its Modal bill was 419 USD on 11-17 (highlight detection 296) against 173 to 215, and back to 204 on 11-18, the first full day in slots mode ([#15142](https://github.com/reductoai/api/pull/15142)).
- Maverick EU: 1.17 on both days (1,497 and 1,843 USD) against 0.75 to 1.08 on weekdays before; no cluster GPUs in the EU. Modal utilization 2.5% against 4.8%, 213 paid GPU-hours a day against 181. 11-19 to 16:00 UTC: 1,483 USD for 1.46M calls (1.02). Cause not found.
- EU Triton core vision and Qwen RF-DETR got their first real router traffic on 11-19 (301k and 243k releases by 16:00 UTC), so they stay "not on the router" in this read.
- Not done: the inference-health page's own COGS (sign-in refused on 11-17, not retried; recomputed with its loaders and config), live PostHog shares, the cause of the Maverick EU rise.

</details>

<details>
<summary>2026-11-19 10:00 PT, daily footgun hunt (first run)</summary>

- Scope: the router client (<code>src/lib/inference_router/client.py</code>), the router proxy (<code>inference-router/internal/proxy</code>), the controller config of US prod, then 24 hours of router metrics in Tinybird (<code>router.upstream.status</code>, <code>controller.capacity.errors</code>) to 10:00 PT. dynamo-stable: not swept yet.
- Checked, nothing to fix: capacity read errors are tens a day for each cluster; <code>lease_unknown</code> 887 of 5.9M <code>fpp-35b</code> calls; cluster 529s 784 of 5.9M; Magpie 400s 266 (request faults).
- Not looked at yet: EU FigSum 502s from Modal (244), Triton core vision 503 and 500 from Modal (312 and 152), the router's admission scripts and mailbox, the controller's target rules, dynamo-stable.
- 10:45 PT, second pass, no new find:
  - Router admission: read <code>admit.lua</code>, <code>admit_low.lua</code> and <code>grant.lua</code>; no bug. The 24 hour counters agree: at most 399 expired leases for a cluster, 809 unknown leases and 799 admit reconnects on <code>fpp-35b</code>, against millions of calls. <code>reap.go</code>, <code>renew.go</code> and <code>mailbox.go</code> were judged by these counters, not read line by line.
  - Finding 11, likely mechanism (read from the code, not reproduced): on SIGTERM a Dynamo worker leaves discovery first (<code>graceful_shutdown.py</code> in dynamo-stable), so the frontend can answer 404 for the model before the pods are gone, and the cluster's <code>/capacity</code> already drops terminating pods (<code>load_summary.py</code>). What is left would be the lag of one summary and one controller poll: 300 calls at 32 calls/s is about 10 s. Stays a watch item.
  - dynamo-stable: only that shutdown path and the frontend's 404 were read. Not read: the Rust router and KV router, the vLLM worker's queue counts, the planner.
- Monitor paged at 2.388% of <code>fpp-2b</code> calls for 10 minutes. 81 calls, 2 orgs, all served on the retry; over since 10:52:48 PT. Cause for this job and what is still open: finding 12 in the Plan above.
- Sources: Tinybird <code>otel_metrics_sum</code> (<code>router.confirm.unknown</code>, <code>router.upstream.status</code>) and <code>otel_traces</code> (traces <code>01a1f52705fb71d399c851a1e16cc586</code> and <code>01a1f51f2d9edc0539cae798e9e4124f</code>).
- No code change, no PR: the plan waits for Jean's stamp.

</details>

<details>
<summary>Impact</summary>

- Cancel on disconnect ([#15195](https://github.com/reductoai/api/pull/15195), live in prod Nov 17, 16:25 PT). Before: about 750 of 942 cancelled R-1 pages were still generated in full on Modal. After: none of 299 cancelled calls ran more than 0.2 s past the drop; 297 stopped a median 0.04 s after it. Measured in prod on the Nov 17 load test spill.
- Same fix on staging: 5 dropped pages ran 10 to 11 s to the end before, none after. 24 dropped at once left no running or waiting request within 1.2 s.
- Modal share monitor ([#15233](https://github.com/reductoai/api/pull/15233), applied Nov 17, 18:08 PT). Before: 1 false alert (99.891% Modal for <code>fpp-2b</code> in prod\_eu). False alerts since: not measured yet.
- GPU cost per 1k calls or pages after the router move: on the [router migration page](https://app.notion.com/p/4164a78a1c87818ea15bdef76227228c), refreshed daily.
- R-1 on one GPU, dev only, nothing deployed: 0.612 USD per 1k pages on an A100 80GB and 0.387 on an H100 at 16 in flight, 0.341 on an H200 at 20 in flight, against 0.131 for the B200 package in prod.
- Utilization (autoscaler queue signal) and fallback counts (<code>reducto.inference.backend_fallbacks</code>, added by [#15185](https://github.com/reductoai/api/pull/15185)): not measured yet; measure before vs after once the fixes ship.

- [Modal ingress limit: split any Modal server (R-1 mini first)](https://app.notion.com/p/41d4a78a1c87818182cbf2c3fea40d32)

</details>

<details>
<summary>409 alert floor (Logs)</summary>

- Monitor 29705142 alerted at 99.891% Modal for <code>fpp-2b</code> in prod\_eu, which has no GPU cluster. The query skips a namespace with no cluster calls, but a 409 <code>lease_unknown</code> reject is tagged <code>cluster:unknown</code> and counted as one (1 such call at 01:00 UTC).

</details>

<details>
<summary>409 alert floor (2026-11-19 11:20 PT, INC-3615 (409 lease_unknown on fpp-2b))</summary>



</details>

<details>
<summary>409 alert floor (restored)</summary>

- Needs Jean's pick
  - (9) Admit-deadline spill swamps Modal R1 (Basis burst, 2026-11-17 14:52 to 14:54 PT): at the 23 s admit deadline every queued page goes straight to Modal at once, past the router's seat count. 1,217 direct calls started within 1.6 s (14:53:46 to 14:53:47 PT) and landed on the 3 R1 containers ready then (416, 463 and 462 requests, 16 seats each). They waited in vLLM's queue a median 135 s (p90 243 s), so 909 hit the 97 s budget and were cancelled (plus 33 router-leased Modal calls on the same containers: 942). 323 Basis pages finished under 97 s
    - Not cold starts: R1 containers took 19 to 31 s from creation to first request. Requests stayed on the container they were first sent to, so the 12 containers that came up later served almost none of the wave
    - About 750 cancelled pages were still generated in full after their caller left (median 22k output tokens, 18 s of a seat each), which kept the 3 containers busy until about 14:58 PT
    - Queue-driven scale-up did fire, too small and after the wave: controller queue gauge 1,434 at 14:53:07 and 2,856 at 14:53:37 PT; first 2 containers created 14:53:22, ready 1 at 14:53:37, 7 at 14:54:07, 11 at 14:54:37, 15 at 14:55:07 PT. 15 matches the <code>drain_s</code> rule (queue x <code>seat_s</code> 1.16 / (16 x <code>drain_s</code> 20)); the plain queue rule gives 179 for 2,856 tickets. The rate rule ordered none (451 pages/s x 1.16 s is under the cluster seats), and these pages held a seat 18 s, not 1.16 s. The controller does not see direct calls, so once the queue spilled its signal went to 0
    - 1,606 against 1,221: <code>fallback=true</code> is on every <code>model.call</code> that Modal serves, also the ones the router leased a Modal seat for (<code>via_router=true</code>), which are not spills. 14:52 to 14:54 PT has 1,220 direct calls (1,221 <code>router_fallback</code> <code>admit_deadline</code> events) and 470 router-leased ones; 841 through 14:55 PT
    - Not verified: the controller's target and floor-write times (<code>controller.modal.*</code> is not in Tinybird, the Datadog keys on the box return 403), and why Modal's own autoscaler stopped at 15 containers with about 1,200 calls in flight
    - Fix (a): spill only what Modal can seat. At the admit deadline send a page to Modal only for a free seat of the controller's Modal cap, and fail the rest to Gemini at once. This burst: the same pages on Gemini 97 s sooner, and Modal not swamped
    - Fix (b): order Modal before the spill lands. When the oldest ticket nears the admit deadline, size by the plain queue rule with the measured seat time. The queue was visible by 14:52:50 PT and the wave landed at 14:53:46 PT. Costs Modal dollars (the config comments put the queue rule near 4x the container-minutes)
    - ✅ Fix (c), merged in [#15195](https://github.com/reductoai/api/pull/15195): the R1 wrapper cancels a buffered completion when its caller disconnects, which closes its vLLM stream. Takes effect on the next <code>fpp-flash</code> deploy; check on stg that Modal passes the disconnect to the container and that vLLM drops the page
    - (1) [#15187](https://github.com/reductoai/api/pull/15187) does not cover this: the clusters cannot add GPUs in 23 s, and direct calls never enter the admit queue
  - (10) Modal refuses leased R-1 mini seats with 429, and the worker retries on the same pool (load test, 2026-11-18 12:00 to 12:02 and 12:14 to 12:15 PT): Modal answered 429 to 299,242 of the router's Modal-leased <code>fpp-2b</code> calls (<code>router.upstream.status</code>), 40 to 47% of them in the first three minutes, while the controller reported 350 ready R1Mini containers and a cap of 9,800 seats, queue 0
    - Each 429 ends the lease and raises <code>RouterUnavailable(status_429)</code>; <code>_launch_via_router</code> (<code>src/lms/r1_call.py</code>) then sends the page straight to the same Modal server, past the router. Sampled <code>model.call</code> spans: 119k first calls with 429, 23k direct calls with 429 again, 8k transport retries with 429 a third time
    - The router does not count a 429 as a fault of the cluster (<code>fault()</code> in <code>inference-router/internal/proxy/proxy.go</code>) and the cap stays ready x 28, so it keeps leasing seats that Modal refuses
    - 99.9% of these calls were the Reducto Load Testing org; about 200 customer calls got a 429 on the first call and about 25 again on the direct call
    - Cause of the 429 (checked 2026-11-19 10:30 PT): Modal refused the calls at its edge, not in a container. The 429s came back in a median 30 ms (p90 158 ms); the R1Mini server sets no <code>max_concurrency</code> (Modal's only per-container 429) and the wrapper never answers 429; the calls Modal took ran a median 1.06 s (0.7 s before the burst), so about 3,600 calls/s were in flight on a third of the 11,200 seats. That is a limit on requests per second, which [Modal documents](https://modal.com/docs/guide/webhooks) for web Functions (200/s for each Function with bursts, 2,000/s for a workspace, raised through their support). Not confirmed with Modal, and the point is not fixed: 429s began at 2,920 calls/s at 11:59 PT, and 3,456 calls/s passed at 12:13 PT
    - More containers would not have helped, and each retry spent the same limit: the direct calls and transport retries were about a third of what reached Modal in the burst
    - The 350: a floor that someone set, not the controller's rule and not Modal's autoscaler. Ready held 245 from 11:10 to 11:45 PT, 25 minutes of it with no router traffic to Modal, rose to 350 by 11:55 PT before traffic came back at 11:57, and held 350 until 12:30 PT, 14 minutes after the last call; <code>fpp-flash</code> had no deploy in that time. The controller's hold is 120 s. Not found: who set it (a pre-warm for the load test is the likely source)
    - Not verified: how many pages failed in the end
    - Options, none built (revised after the cause check):
      - (a) Ask Modal which limit answered 429 and to raise it for <code>fpp-flash</code>. No code. Risk: none of ours; until they answer, R1Mini on Modal tops out near 3,000 calls/s
      - (b) On a 429 from a Modal lease the worker does not call the same Modal server directly: it asks the router for a lease on another cluster once (as it does today for a 529 from a GCP head), and fails the call as retryable if none is free. Cuts up to two wasted calls a page and stops retries from spending the limit. Risk: in a burst the clusters are full, so those pages wait in the admit queue or fail instead of trying Modal again; not flag-gated, needs a plan
      - (c) The controller lowers the Modal cap while Modal answers 429, so pages queue in the router instead of bouncing. Risk: the most code, in the router and the controller; a cap that drops too far queues customer pages; needs a router deploy by Jean
      - (d) Leave the code, add a monitor on Modal 429s for each namespace. Risk: the next load test or a large customer hits the same wall, with the retries on top
      - My pick: (a) now, and (d) with it; (b) as a plan once Modal has said what the limit is
    - Decided 2026-11-19 14:25 PT, moved to the split plan: Modal says the limit is about 1.2 GB/s of ingress for each <code>app.server</code>, so Jean picked splitting R-1 mini across several <code>app.server</code>s with a cap for each copy. Another session owns that plan and its PR; the daily hunt no longer tracks this finding. For sizing the copies: the router's <code>router.bytes</code> counter for these calls read 2.4 GB/s at 11:58 PT and 3.0 to 3.1 GB/s from 11:59 to 12:01 PT (which direction it counts was not checked)
  - (12) INC-3615, 409 <code>lease_unknown</code> on prod <code>fpp-2b</code> (2026-11-19 10:43 and 10:52 PT): page calls reached the router more than 5 s after the router granted their lease, and an unused lease lives 5 s. Plan below, nothing built, waits for Jean's stamp
    - My pick, revised 11:35 PT: PR (a) now. PR (b) is small and fixes only the Nov 19 shape; the Nov 18 shape (crowded pod) is the larger share of 409s and needs its own plan (how many 50-page batches of one job a cpu pod takes at once), not written yet
      - Update 13:30 PT: (a) now, and (c) in place of (b) as the one code PR. Crowding made the Nov 17 and Nov 18 bursts worse and is absent on Nov 19 07:36 PT, so the shared part is the work that starts with the sends. (d) only if (c) does not cover crowded pods
    - What happened: 81 calls got 409, all <code>reason=unknown</code>: 77 from one getgc\_ai job (<code>7ae3ba18</code>, 2,066 pages, 42 batches), 4 from one Diode 2 job. The client's one retry with a fresh lease served each of them, so no <code>lease_unknown</code> fallback. 3 pages of the first job went to Modal after a first call that ended with no status after up to 7.9 s. No 409 on <code>fpp-2b</code> after 10:52:48 PT (checked to 11:05 PT)
    - Plan, two lean PRs:
      - (a) Monitor (<code>terragrunt/modules/datadog-monitors/definitions/inference_router_lease_unknown.yaml</code>): keep 1% over 10 minutes and add a floor of 200 409s in the same 10 minutes. Jean applies it
        - Why: the monitor is a ratio with no floor. 77 409s against 2,859 calls in 5 minutes on a quiet namespace is over 1%; the largest 10 minutes of Nov 17 to 19 was 441 409s at 0.75%
        - A full outage still pages on a quiet namespace: the 5th percentile of <code>fpp-2b</code> is 480 calls in 10 minutes
          - Correction 14:45 PT: true for prod <code>fpp-2b</code> only. A namespace with 200 calls or fewer in 10 minutes cannot alert, also when every call gets 409, and <code>inference_router_errors_sustained</code> leaves <code>lease_unknown</code> out, so no monitor pages for it. Share of 10-minute windows with 200 calls or fewer, Nov 16 to 19: prod <code>extract-v4-magpie</code> 14.8%, <code>triton-change-tracking</code> 22%, <code>triton-highlight-detection</code> 23.7%, the other prod namespaces 0.2% or less; prod\_eu <code>fpp-2b</code> 81%, <code>extract-v4-magpie</code> 93.8%, <code>citation-7b</code> 48.5%, <code>fpp-35b</code> 17.2%, <code>maverick</code> 0.5%. The calls are still served: the client retries once, then falls back to Modal
          - PR (a) is open as stamped: [#15449](https://github.com/reductoai/api/pull/15449). CI and the Scalr plan pass, Codex has no finding. Not verified: Datadog has not evaluated the new query (the validate hook got a 403), so that it clamps the 10-minute sum and not each point rests on Datadog's guide; Devin Review flagged the same and it is left for someone with Datadog access
          - Update 14:25 PT: nobody could run that check, so #15449 no longer uses a clamp. The page comes from a composite of two monitors: the share above 1% (the query on main) and more than 200 calls with 409 in the same 10 minutes. The share monitor still posts to Slack at 1% with no floor, so the quiet namespaces above stay visible in Slack and only the page needs the floor. CI and the Scalr plan pass (3 to add, 1 to change; one add, <code>modal_aws_identity_fallback</code>, is from #15281, merged and not applied yet), Codex and Devin Review have no finding. Not verified: Datadog has not evaluated the queries (403)
      - (b) Text-layer read (<code>src/pipeline/batch/fpp/</code>), behind a flag, default off: start the PDF metadata work once the batch's submitted page calls are sent, waiting at most about 1 s, instead of right after the last render
        - Why: that read aged the leases in the Nov 19 job (cause below)
        - Open design point: how the stream learns that the calls are sent (<code>lms.r1_call</code> owns the event loop)
        - Test: on staging, a 50-page PDF with links, before and after: lease age p50, p90 and max, <code>router.confirm.unknown</code>, batch wall time. Then the local runner on 8 to 10 PDFs with links against <code>origin/main</code>
        - Risk: the hyperlink and comment step waits for the text layer, so a batch whose read is longer than its model calls ends up to about 1 s later. (b) fixes the Nov 19 job shape only, not the Nov 18 bursts
      - (c) Option for the <code>fpp-35b</code> bursts, in place of (b), same flag: start the OCR lane as well as the PDF metadata work once the batch's submitted page calls are sent, waiting at most about 1 s
        - Why: in all four traced events, work that starts after the last render ran in the batch process while its calls were admitted and sent. On Nov 19 07:36 PT that org's 3,743 calls each held a seat 1.6 s at p50 before the request arrived
        - Test: as (b), plus a 50-page PDF with OCR words on, and 15 batches of one job at once on one staging cpu pod
        - Risk: the OCR lane starts up to about 1 s later, so a batch whose OCR is longer than its model calls ends that much later. On a crowded pod the other batches' work still takes the cores, so how much (c) covers there is not known before the test
      - (d) Not proposed now: fewer than 21 batches at once on a cpu pod. It needs more pods for the same load and Jean runs Helm. Worth a look only if crowded pods still pass 5 s with (c) on
      - Not proposed: a longer unused-lease life (it keeps GPU seats reserved and idle for longer and hides the stall); a subprocess for the read on the cpu worker (the compute child enables no pool)
    - Cause on Nov 19: the in-process text-layer read for hyperlinks (<code>batch.build_metadata_ocr</code>, started by <code>PdfMetadataWork.start</code> after the last model render)
      - Lease age is the first <code>chat/completions</code> span minus the end of the <code>admit</code> span. Every 409 was over 5.0 s (lowest 5,007 ms), every served first call under it (highest 4,998 ms)
      - In 35 of the 40 batches I could pair, the p90 lease age is the read's length plus 0.1 to 0.6 s; reads ran 0.6 to 10.1 s. 4 to 19 of a batch's 50 calls reached the router during the read, most of the rest within 1 s of its end. 12 batches had a read of 4.1 s or more; 9 of them had 409s
      - 2 batches the read does not explain: their calls went out 1.5 to 2 s after it ended (in one, <code>fpp.attach_hyperlinks</code> ran then). One of them holds 8 of the 77, so moving the read alone covers 69
    - Cause on Nov 18, found 11:35 PT: many batches of one job on one pod at once. The text-layer read is not it: the largest burst (441 on <code>fpp-35b</code>, 13:20 PT) came from 2 jobs, one with reads of at most 1.3 s and one with no read
      - Two Brilliant Harvest jobs (about 1,000 pages each, 20 batches of 50) started together. The pods that ran 16 and 14 of their batches at once had all 441 409s (lease age p50 4.1 and 3.8 s, p90 6.9 and 6.1 s; the workers' own admit wait p90 6.9 and 6.4 s). The pods that ran 4 and 6 batches of the same jobs in the same seconds had none (age p50 32 and 125 ms)
      - Same 5.0 s line (lowest 409 at 5,003 ms). 434 of the 441 got a 200 on the retry inside the window I read; the other 7 not followed
      - Pod CPU on Nov 18, read 11:45 PT (Tinybird <code>pod_cpu_usage_seconds_total</code>; all four pods sit on 16 vCPU nodes, r7i.4xlarge): in the 30 s of the burst the pod with 16 batches used 16.1 cores and the one with 14 used 10.1, then 17.0 in the next 30 s. The pods with 6 and 4 batches used 8.0 and 4.3. Each used 1 to 3 cores before. Not read: the pods' CPU limit and CFS throttling
      - Daily <code>lease_unknown</code> counts on <code>fpp-35b</code> plus <code>fpp-2b</code>: 228 on Nov 17, 1,000 on Nov 18, 410 on Nov 19 to 11:05 PT, under 0.01% of calls
    - Two more bursts traced, and what the four events share, found 13:30 PT
      - Nov 17 18:32 PT (155 on <code>fpp-35b</code>): one job, 15 batches of about 50 pages at once on one pod, all 155 there. No batch had a text-layer read. The pod averaged 9.3 cores over the 27 s around it
      - Nov 19 07:36 PT (151 on <code>fpp-35b</code>): not a crowded pod. One org (Hebbia Testing) started 240 jobs within a minute; the 10 batches with 409s sat on 9 pods that ran 1 to 6 batches each. All 151 were in batches of 40 to 50 pages that ran both an OCR lane and a text-layer read: 102 in the 19 batches whose read took 3 s or more, 21 where it took 1 to 3 s, 28 where it took under 1 s. Batches with no read had none
      - Not the router: of the calls granted in the same 10 s on the same router, the other orgs' 1,513 had a lease age of 13 ms at p50 and 112 ms at p90; that org's 3,743 had 1.6 s and 4.1 s
      - Where the time goes: inside the batch process. In the Nov 17 and Nov 18 bursts, batches with 409s took 0.7 to 0.8 s (p50) from the grant to the worker reading it and 2.6 to 3.3 s from the worker starting the call to the router receiving it; batches of the same jobs without 409s took 46 ms and 108 ms. The client has no connection limit (<code>src/lms/r1_call.py</code>), so it is not a wait for a connection
      - What those batches were doing: work that the stream starts after the last model render, in the process that sends the calls. An OCR lane in all three <code>fpp-35b</code> bursts: it started before the batch's first grant in 11 of 15 and 22 of 26 batches with 409s, and in 2 of 14 without. A text-layer read on Nov 19. With the render service the renders are remote, so this work starts while the batch's calls are still being admitted and sent
      - Not separated: a crowded pod against an OCR lane that starts before the grant (the second can be a result of the first). Pod CPU is sampled every 30 s, so it cannot show or rule out a few seconds at 16 cores; only the Nov 18 13:23 PT burst shows a pod at 16 of 16. The read's length is wall time, so a slow process also makes the read longer. Not checked: whether the Nov 19 incident job also ran an OCR lane
      - A cpu pod takes up to 21 batches at once and has no CPU limit; two pods share a 16 vCPU node (<code>helm-charts/values/prod-values.yaml</code>)
    - Not verified: that the GIL is what slows the event loop (the repo docs say PyMuPDF holds it; I measured the timing only); what held the calls in the 2 batches above; why the 3 first calls ended with no status; the pods' CPU on Nov 18 (not read), so "the pod ran out of CPU" is my inference from the split; whether the other daily bursts have the Nov 18 shape (only that one was traced)
      - Update 13:30 PT: the pods' CPU on Nov 18 is read and two more bursts are traced (see the two blocks above). Still not verified: which work in the process holds the calls (the OCR lane, the read, or the pod's other batches), and so whether (c) removes the delay. The staging test measures that

</details>

