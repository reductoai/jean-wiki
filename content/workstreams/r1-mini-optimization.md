# R-1 mini optimization and productionizing

RL 299 on B200

{{dashboard:r1-mini-optimization}}

## Details

<details>
<summary>Plan</summary>

- RL 299 on B200
  - Prod pick: move prod to <code>20261117</code> / <code>b200-n128</code>, once the evalkit judge, a wide set and a day of autoeval pass
- RL 299 on H100 and H200 (AU's engine)
  - AU pick: move <code>prod_au</code> to <code>20261117-h100-int8</code>, once the evalkit judge passes
- RL 299 on A100 80GB
  - [#15276](https://github.com/reductoai/api/pull/15276): add RL 299 as <code>20261117-a100-int8</code>
- RL 299 on B300
  - Profile PR: add <code>20261117-b300-nvfp4</code> with its perf table (PR not open)
- Roofline for every chip (plan, awaiting Jean's stamp; asked on #15276: "this is the most we can get from the gpu? do we have a roofline graph?", "We should do that for all chips")
  - Today: a measured roofline graph exists for one chip, B200 on the 1028 package (<code>workstreams/2026/11/10/fpp_2b_b200_roofline</code>, the run that found prefill cadence, +20%). A100, H100, H200, B300 and L40S have none. <code>ROOFLINE.md</code> in the RL 299 workstream is a plain-decode bound for B200, H100 and L40S; it leaves out the vision tower, prefill and DFlash, and vision attention alone was 32 to 37% of GPU time on the B200, so it cannot answer the question.
  - Step 1, measured roofline per chip: one Modal dev sandbox per chip on the profile's registry flags. AIPerf at the gate level and at the peak (rep-1k, 180 s each) with GPU busy %, power and clock sampled, then a torch-profiler window at the gate level. Reuses the B200 workstream's <code>launch.py</code> and <code>analyze.py</code>, made chip-generic. Per chip: the roofline graph (each kernel's TFLOP/s at its FLOPs per byte against the chip's compute and HBM roofs), GPU time share per kernel group, % of roof per group.
  - Step 2, one summary graph and table: per chip, pages/s at the gate, GPU busy %, the state (GPU-bound, host-bound, power-capped) and the largest gap with the lever it points at. That is the answer to "is this the most we can get" for each chip.
  - Step 3, one PR as Devin: workstream <code>workstreams/2026/11/18/r1_mini_roofline</code> (README, RESULTS, scripts, graphs) and a Roofline line per variant in <code>r1_mini.md</code> linking its graph. No registry, pick or deploy change. Levers the graphs point at come back as a separate plan.
  - Chips and profiles: A100 80GB <code>20261117-a100-int8</code> first (the question was asked there; it flattens at 4.0 to 4.4 pages/s from 16 to 128 in flight), then B200 <code>b200-n128</code>, H100 and H200 <code>20261117-h100-int8</code>, L40S <code>l40s-1112</code> (1028 weights, the Marketplace chip), B300 <code>20261117-b300-nvfp4</code> once its profile exists. Not Inf2 or TPU v6e: no GPU roofline applies.
  - Cost: about 0.75 GPU-hour a chip, about 4.5 GPU-hours, about \$20 on Modal dev. No prod.

</details>

<details>
<summary>Logs</summary>

PR states read Nov 18, 12:52 PT. ✅ is merged. The <code>rl299</code> shadow is deployed to Modal dev, and prod release <code>v1.12.24-715</code> carries the #15274 merge. No prod or AU pick has changed. Every judge number is from the workstream's 05-gates judge; evalkit's pinned judge has not run on RL 299 and runs before any pick.

- RL 299 on B200 (<code>20261117</code>, Modal dev shadow <code>rl299</code>):
  - [#15274](https://github.com/reductoai/api/pull/15274) ✅ Nov 18, 11:12 PT + Deploy (Nov 18, 11:46 PT, Modal dev shadow <code>fpp-flash-rl299</code>, from <code>main</code>, Jean's go via Xavier). It answered a warm-up page.
  - Prod release <code>v1.12.24-715</code> carries the merge; its rollout finished Nov 18, 12:05 PT. No pick changed.
  - <code>autoeval-replay</code> cron redeployed Nov 18, 12:23 PT, the last of #15274's three deploy steps.
  - 32.2 pages/s at 128 in flight, \$0.054 per 1k pages.
  - Judge against BF16: net -3 on rep-1k (floor -30), net -23 on public 2k (floor -60).
  - Load came from the 05-gates harness, not the shared AIPerf runner.
  - [#15317](https://github.com/reductoai/api/pull/15317) ✅ Nov 18, 12:28 PT. Tables only, nothing to deploy: the same table from the shared AIPerf runner. 31.31 pages/s at 128 in flight, \$0.055 per 1k pages; p90 stays under 10 s through 128 in flight.
  - [#15324](https://github.com/reductoai/api/pull/15324) ✅ Nov 18, 12:46 PT + Deploy (Nov 18, 12:26 PT, Modal dev, from its branch, Jean's go): the hourly dev cron <code>autoeval-dev-floors</code> keeps <code>fpp-flash-rl299</code> warm instead of <code>fpp-flash-b200-route</code>. The <code>auto_route</code> leg on <code>fpp-flash-b200-route</code> now starts cold, which Jean accepted.
  - Open: against the 1028 package, p99 at 16 and 32 in flight is 1.20 to 1.30 times, so the strict A/B rule fails. Cause not found.
  - Nov 18, 10:14 PT, [Slack](slackMessage://reductoai.slack.com/C0C8Y03DC3G/1795025644.667359/1795025644.667359): the team wants to ship the new checkpoint. RL 299 has no autoeval day or wide set yet.
- RL 299 on H100 and H200 (<code>20261117-h100-int8</code>, AU's engine):
  - [#15275](https://github.com/reductoai/api/pull/15275) ✅ Nov 18, 12:49 PT. Not in a prod release yet: <code>v1.12.24-724</code> was cut before it. Its release redeploys <code>fpp-flash</code> with the same images.
  - H100: 12.94 pages/s at 32 in flight, \$0.085 per 1k pages. Judge against RL 299 on B200: net -3 (bound -30).
  - <code>prod_au</code> stays on <code>20260928</code> / <code>h100-int8</code>.
  - [#15245](https://github.com/reductoai/api/pull/15245), the 1028 version, closed unmerged Nov 17, 21:11 PT (Jean: RL 299 only).
  - Full log: <a href="https://app.notion.com/p/41c4a78a1c878145ac76f1795c896483">R-1 mini RL 299 as INT8 on H100 (AU)</a>
- RL 299 on A100 80GB (<code>20261117-a100-int8</code>, dev host only):
  - [#15276](https://github.com/reductoai/api/pull/15276) open, renamed from <code>a100-1112</code>, CI green on <code>7ba4925329</code>. Conflicts with <code>main</code> since #15275 merged.
  - No longer builds on #15223: the 1028 <code>a100-int8</code> host and recipe are out of it. The variant targets 16 in flight, to match the gate.
  - Roofline (Nov 18, one Modal dev pod, [#15342](https://github.com/reductoai/api/pull/15342)): saturated at 16 in flight, with headroom in the kernels. A GPU kernel runs 99% of the profiler window (PCIe pod, 3.16 pages/s, 295 of 300 W), and the kernels with recorded shapes (50% of kernel time) run at 52% of their roof; at the roof, about 4.1 pages/s (+30%). Replaces the first graph, whose window was at 1 in flight.

![A100 80GB roofline](https://app.devin.ai/api/presigned_proxy?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjpudWxsLCJidWNrZXRfbmFtZSI6ImRldmluYXR0YWNobWVudHMiLCJidWNrZXRfa2V5IjoiYXR0YWNobWVudHNfcHJpdmF0ZS9vcmdfUWxrcUZvbVlaWENvTVVBTS85NjQyNmJlNy04NjNkLTQzMjYtYjBkNS0wN2FlN2RkZjRmNmUiLCJpYXQiOjE3OTUwNDc2ODIsIm9yZ19pZCI6Im9yZ19RbGtxRm9tWVpYQ29NVUFNIiwiZmlsZW5hbWUiOiJyb29mbGluZV9hMTAwLnBuZyJ9.v3sDdKpwFNMA-Fda1lrG0hKnnsNWFQa2HQEznAwpWIo)

\- Lever 1, vision attention on INT8 tensor cores (lossy, needs the judge gate): 34% of kernel time at 161 TFLOP/s; the BF16 roof is 312, the INT8 roof 624.<br />- Lever 2, INT8 vision linears (tiles, epilogues): 7.7% of kernel time at 36 to 46% of roof; the language model's INT8 GEMMs run at 51 to 68%.<br />- Lever 3, fewer vision tokens per page (lossy, needs Jean's approval): vision attention FLOPs grow with tokens squared.

- RL 299 on B300:
  - Started Nov 18, 12:23 PT, at Jean's ask. The variant will be <code>20261117-b300-nvfp4</code>. No PR yet, nothing merged or deployed.
- 1028 on A100 80GB (<code>a100-int8</code>, dev host only):
  - [#15223](https://github.com/reductoai/api/pull/15223) closed unmerged Nov 18, 12:03 PT (RL 299 replaces 1028). Not deployed.
  - Earlier log: <a href="https://app.notion.com/p/4144a78a1c87818aa1e5c58e377ad01b">R-1 mini on A100</a>
- 1028 on other hardware: closed unmerged Nov 18, 11:35 PT (Jean: RL 299 replaces 1028). None was deployed.
  - [#15240](https://github.com/reductoai/api/pull/15240): B300 tables for <code>b200-n128</code> and <code>b200-b300-128</code>
  - [#15239](https://github.com/reductoai/api/pull/15239): L4 as <code>l4-1112</code>
  - [#15246](https://github.com/reductoai/api/pull/15246): A100 40GB as <code>a100-int8</code> with 20 seats
  - [#15231](https://github.com/reductoai/api/pull/15231): A10G as <code>a10g-int8</code>
  - [#15247](https://github.com/reductoai/api/pull/15247): Inferentia2 as <code>inf2-1028</code>. Marketplace picks stay on <code>20260928</code>.
  - [#15229](https://github.com/reductoai/api/pull/15229): TPU v6e INT8 latency columns and judge result in the README

</details>

<details>
<summary>Impact</summary>

- B300 vs B200, back to back: 21.4 vs 32.2 pages/s per container (B300 range 21.4 to 31.0). Measured on dev, 2026-11-18 (Jensen).
- B300 FP8 vision attention ([#15385](https://github.com/reductoai/api/pull/15385), 20261117-b300-fp8attn vs 20261117-b300-nvfp4, back to back on one dev B300, AIPerf rep-1k): AMD hosts +6.2% to +9.7% at 64 in flight and +9.2% to +11.8% at 128 (30.0 to 30.8 → 33.2 to 34.0 pages/s); Intel host +3.3% and +4.5% at 128, +6.9% and -1.4% at 64. Measured on dev, 2026-11-19.
- B300 package: 28 pages/s at 128 in flight, about 10% under B200. Measured on dev, 2026-11-18.
- A100 roofline: 99% busy at 16 in flight; slow kernels leave about 30%. All-chip kernels at 32 to 73% of roof. Measured 2026-11-18.
- GPU cost per 1k pages at saturation, dev, one container: RL 299 on B200 \$0.055 at 128 in flight (31.31 pages/s); on H100 INT8 \$0.085 at 32 in flight (12.94 pages/s).
- Quality, RL 299 against BF16: judge net -3 on rep-1k (floor -30) and -23 on public 2k (floor -60).
- p99, RL 299 against the 1028 package: 1.20 to 1.30 times at 16 and 32 in flight. Cause not found.
- Prod: no prod or AU pick has changed, so prod GPU cost per 1k pages, p99 and utilization are not measured yet; measure before vs after each pick change. Today R-1 mini costs 4.79 USD per 1k pages across regions (11-09 to 11-17), and 1.55 on 11-17 at 1.48M pages.

- [B300 vision attention kernel](https://app.notion.com/p/41d4a78a1c8781a4ad89e88f7360607d)

</details>

