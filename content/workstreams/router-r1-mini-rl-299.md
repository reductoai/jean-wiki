# Router for R-1 mini RL 299

Goal. By Fri 11/20, pick the page router for R-1 mini RL 299 (reducto/fpp_2b_rl299_jev_20261117@153ee1ac, Modal dev shadow rl299, #15274). Retrain the route head (#14939) and the old router (fpp_router_0913) the way each was first trained, then compare them…

{{dashboard:router-r1-mini-rl-299}}

## Details

<details>
<summary>Overview</summary>

<b>Goal.</b> By Fri 11/20, pick the page router for R-1 mini RL 299 (<code>reducto/fpp_2b_rl299_jev_20261117@153ee1ac</code>, Modal dev shadow <code>rl299</code>, [#15274](https://github.com/reductoai/api/pull/15274)). Retrain the route head ([#14939](https://github.com/reductoai/api/pull/14939)) and the old router (<code>fpp_router_0913</code>) the way each was first trained, then compare them offline and in autoeval. Every candidate gets at least 24 h of autoeval. US, EU and AU roll out together; Jean decides and deploys. Non-goal: new router designs.

<b>Jean's two calls</b> (with the stamp; defaults in place)

1. <b>Fallback for Yifei's data.</b> His 83k pages and labels are not in S3. If they are not found by Wed night (PT), we retrain the old router on the route head's 20.5k pages, with 3-class labels from the same Astra scores. That changes how it was trained, so it needs your OK. Without it, the old router is compared only as shipped.
2. <b>Which R-1 defines "big".</b> Default: prod R-1 (1112). The stored R-1 parses come from <code>reducto_fpp35b_rl1027_6m</code>, so 1112 means re-parsing the R-1 side too, about 2x the parse cost.

</details>

<details>
<summary>Plan</summary>

- Recipe PR (route head): rebase onto the training scaffold, add <code>--checkpoint</code>
  - Exit check: the 20261028 checkpoint and the recovered data reproduce <code>8d891b9a</code> (at least 99.5% decision match at 0.58 on the 2,000 ParseArena pages)
- Relabel the route head for RL 299 (Wed)
  - Parse the 20,486 pages on <code>rl299</code>, judge each against its stored R-1 parse with Astra (\~0.5 B200-h, 20.5k calls)
  - Reuse the chart labels (image only); prefill features from the RL 299 bf16 checkpoint (\~1 H100-h)
- Train and export the route head (Thu AM)
  - Same Huber loss, 60 epochs, weight decay chosen on held-out documents, CPU minutes; int8 export and HF upload
- Retrain the old router (Thu AM)
  - Relabel Yifei's 88k pages with RL 299 as "small" (\~2.5 B200-h and 88k Astra calls, the largest cost; fallback is a 30k subset)
  - Train with the 0913 config on 4×H200 (a few hours): 3 epochs, keep the best validation checkpoint (epoch 2 last time); calibrate the threshold on val
- Offline comparison on the 2,000 ParseArena pages, never trained on (Thu AM)
  - Arms: always mini, always R-1, shipped route head, retrained route head, shipped old router, retrained old router
  - Metrics: score at 40% and 50% routed, \$/1k pages (mini \$1, R-1 \$10), Pareto plot, chart recall
- Autoeval the best one or two on RL 299 for at least 24 h (must start Thu PM)
  - Route head through the <code>b200-route</code> image variant; old router through the <code>bs-router</code> shadow relay
- Prod (Fri PM): Jean's call and deploy, US, EU and AU together

</details>

<details>
<summary>Logs</summary>

- Route head
  - Inputs recovered (from Raunak's session): <code>s3://reducto-shared-ml-workspace/jean/handoff/20261115.route-head/</code> holds the 20,486 training pages with R-1 mini parse, R-1 parse and Astra scores; chart labels and prefill features; 2,000 ParseArena pages; the fp32 head and original scripts
  - Export verified: the recipe's int8 export of the fp32 head matches the shipped head <code>8d891b9a</code> tensor for tensor
  - Recipe on a local branch, not pushed: <code>src/hacky/training/recipes/route_head</code> (about 570 lines: select, label, features, train, int8 export, decision match check); a unit test shows the serving <code>Router</code> reads its export
- Old router
  - Found in <code>registry/prod/fpp_router_0913.yaml</code>: Qwen3.5-0.8B, rank-32 LoRA, vision frozen; labels a page small, neither or big from the image alone, routes to big when P(big) minus P(small) > 0.4196
  - Trained on 83,437 train and 5,003 val pages, CE loss, batch 128, lr 1e-4, 3 epochs (best validation checkpoint: epoch 2), 4×H200; run <code>/workspace/home/yifei/.../router_0910_batch_sweep_20260913</code>, weights on Modal volume <code>v2_checkpoints_yifei</code>
  - Training pages and labels not in S3; asking Yifei
- Wed 11/18: plan sent for Jean's stamp
- Wed 11/18: Jean paused the retrain until the new R-1 version lands

</details>

<details>
<summary>Impact</summary>

The retrain is paused until the new R-1 lands, so there is no after yet. The baseline is existing measurements; every after cell is pending.

</details>

<details>
<summary>Baseline (before the retrain)</summary>

| Metric | Value | Source |
| --- | --- | --- |
| GPU cost per 1k router calls, US prod (Oct 15 to 21) | \$0.371 | [fpp\_router\_serving RESULTS.md, Prod baseline](https://github.com/reductoai/api/blob/main/src/hacky/inference/workstreams/2026/10/22/fpp_router_serving/RESULTS.md) |
| GPU cost per 1k router calls, EU (Oct 15 to 21) | \$3.474 | same |
| Router Modal spend, US prod / EU | \$1,814/day / \$220/day | same |
| Client p50 / p90 / p99, US prod | 269 / 561 / 1,616 ms | same |
| Client p50 / p90 / p99, EU | 427 / 1,177 / 3,847 ms | same |
| Timeouts per 1k calls, US prod / EU | 0.64 / 0.39 | same |
| Containers, US prod / EU | 32.0 / 5.1 | same |
| Utilization, 1 router process per H100 | GPU under 40% busy; about 120 ms CPU per page | [fpp\_router\_serving README](https://github.com/reductoai/api/blob/main/src/hacky/inference/workstreams/2026/10/22/fpp_router_serving/README.md) |
| Serving change already shipped (2 processes per H100, target 48) | about 41% less \$/day in the replay | same |

These October numbers predate the 2-process change, so re-measure the baseline from prod (bill and Tinybird) the week before the retrain ships.

</details>

<details>
<summary>After (retrained router)</summary>

| Metric | Value |
| --- | --- |
| GPU cost per 1k pages | pending (retrain paused) |
| Modal spend | pending |
| p99 | pending |
| Fallbacks (pages routed off R-1) | pending; no baseline measured yet |
| Utilization | pending |
| Training cost of the retrain | pending (ledger: <code>python -m hacky.training status</code>) |

</details>

