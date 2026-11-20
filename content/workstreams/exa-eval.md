# Exa eval

Ask: stamp this replay plan and its quality gate. Modeled, $1 per 10k pages is reachable if Reducto hosts every page; $0.25 only if Exa keeps routing in its stack. Quality on Exa's PDFs is unmeasured. All prices are illustrative, not quotes.

{{dashboard:exa-eval}}

## Details

<details>
<summary>Overview</summary>

<b>Ask:</b> stamp this replay plan and its quality gate. Modeled, \$1 per 10k pages is reachable if Reducto hosts every page; \$0.25 only if Exa keeps routing in its stack. Quality on Exa's PDFs is unmeasured. All prices are illustrative, not quotes.

</details>

<details>
<summary>Price model</summary>

The [Parallel reference](https://apps.reducto.ai/internal/parallel-parse-options) prices R-1 nano first at \$1.04 per 10k pages. The [November 11 validation](https://app.devin.ai/sessions/8a7dc61e791349d193de8bc2888b730d) builds it from \$0.23 R-1 nano GPU, \$0.10 fallback and \$0.50 platform at 20% gross margin, with a 0.5% fallback rate from a public benchmark, not Exa's PDFs.

Metadata routing reads the PDF's embedded text layer; trusted pages skip the models. The handoff is the share Exa sends to an outside parser, assumed 20% until Exa confirms.

| Policy | Price per 10k pages |
| --- | --- |
| Exa routes in its stack, hands 20% to R-1 nano | <b>\$0.21</b> Reducto charge, plus Exa's local cost |
| Reducto hosts; metadata keeps 80%, R-1 nano takes 20% | <b>\$0.83 to \$1.02</b>, if metadata routing costs \$0.10 to \$0.25 |
| Reducto hosts; R-1 nano on every page | <b>\$1.04</b> |

- <b>\$1 hosted</b> holds if metadata routing costs at most \$0.23 before margin. Platform alone sets a \$0.63 floor.
- <b>\$0.25 in Exa's stack</b> leaves \$0.04 for Exa's extra local cost.
- <b>Fallback</b> may run above 0.5%, since escalated pages are the hard ones.

Price = <code>(platform + metadata routing + each model + final fallback) / (1 − margin)</code>, charging every attempt and counting capacity, rendering, storage and egress once.

</details>

<details>
<summary>Eval plan</summary>

1. <b>Fix the replay set.</b> 40,007 representative pages (30,003 index, 10,004 latest crawls) set price and quality; 10,000 hard cases report separately. Split by document, group near duplicates. Ask Exa for its routing mask, kept-page output and accept/reject criteria; without them, use a labeled 20% proxy and claim no parity.
2. <b>Compare three setups</b> on the same output (text, reading order, tables):
   - Exa today, the baseline.
   - Hosted: metadata routing, then R-1 nano, R-1 mini, R-1, approved final fallback.
   - Exa's stack: Exa routes locally and sends rejected pages to Reducto; measure local CPU and handoff latency.
   - Controls: metadata only, R-1 nano on every page, pinned R-1 as quality reference. Neither of the first two is a candidate: one has no fallback for bad text layers, the other costs \$1.04.
3. <b>Pick the cheapest safe threshold.</b> Log trust score, outcome, attempts and timings per page. Sweep on a calibration split from the 0.85 server default; lock before the held-out test. Missing scores and invalid output escalate, never drop. Judge with blind ParseBench diagnostics and pairwise preference against Exa's baseline; people check sampled disagreements.
   - <b>Proposed gate:</b> lower 95% bound on the serious-error-free rate difference no worse than −1 point vs Exa, with no material regression on index, latest or hard cases.
4. <b>Check scale after quality passes.</b> 20M pages/day is 231 pages/s hosted, 46 pages/s at a 20% handoff; if 20M is the handoff, 231 pages/s to Reducto and 1,157 hosted. Confirm which, then load test steady and peak.

<b>Approvals:</b> R-1 nano has no API host on main ([registry](https://github.com/reductoai/api/blob/94173526fdd4627f2c436be197b285a436ce5df8/src/model_serving/registry/models/r1_nano.yaml#L1-L13)), so it runs on an approved internal eval runner. [Metadata routing](https://github.com/reductoai/api/blob/94173526fdd4627f2c436be197b285a436ce5df8/src/config/v3.py#L375-L377) is a US-only alpha; Platform must approve before Exa sees it.

</details>

<details>
<summary>Results</summary>

Graphs we expect to plot:

| Graph | What it answers |
| --- | --- |
| <b>Price vs quality:</b> price per 10k pages vs serious-error-free rate, hosted and Exa's stack, with the \$0.25 to \$1 band, baseline, chosen threshold and 95% intervals | Which policy costs least at Exa's bar? |
| <b>Routing and misses:</b> share per stage and failure by threshold, plus serious errors among pages metadata kept | How much stays cheap, and what does it miss? |
| <b>Cost breakdown:</b> per-stage bars per 10k pages; Reducto charge vs Exa's total | Where does the money go as fallback rises? |
| <b>Throughput vs latency:</b> pages/s vs p50/p95/p99 latency and errors, steady and peak | Does it keep up at Exa's volume? |

<b>After the replay:</b> pick the cheapest threshold that passes the gate, then validate capacity before any quote.

</details>

<details>
<summary>Impact</summary>

- ParseJudge, 10k hard-case pages: metadata 4.7 vs 8.2 for R-1 nano; R-1 nano 7.7 vs 9.0 for R-1 mini. Measured 2026-11-18, posted in Slack.
- No prod change yet.

</details>

