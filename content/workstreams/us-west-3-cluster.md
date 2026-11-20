# us-west-3 cluster

We accepted a GCP B200 reservation in us-west3 that comes online Thursday 2026-11-12. We need a GKE cluster ready to put it to work.

<div class="ws-head">
<div class="ws-stat"><b>6</b><span>steps left</span></div>
<div class="ws-stat"><b>6</b><span>PRs merged</span></div>
<div class="ws-stat"><b>12</b><span>PRs open</span></div>
<div class="ws-stat"><b>3</b><span>impact measures</span></div>
</div>

## Next steps

<ol class="steps"><li class="now">Copy uss1 as a third GCP cluster, prod-gpu-usw3, with its own direct hostname gcp-inference-usw3.platform.reducto.ai and router…</li><li>Build everything except the GPU pool now. The gcp-gke module leaves out the b200 node pool until the reservation has a block, so…</li><li>Include the Snapshot cluster prerequisites like uss1 (Filestore CSI, the filestore-zonal-rwx storage class, the snapshot…</li><li>5 PRs: Terraform, Flux root, models on, monitors, router cutover. Traffic only moves in the last one, after a dev-style smoke on…</li><li>Day one: node-local cache on every Dynamo worker. Today an fpp-35b worker took 16.6 min to Ready on uss1 (cache off, 2026-11-10…</li><li>Day one: rollouts that fit a full pool. fpp-35b maxSurge 0 / maxUnavailable 1 (from #14399), so a promote never waits on GPUs the…</li></ol>

## Impact

<div class="impact-grid"><div class="impact-card"><div class="ic-value">Modal fell while pages rose <b>20%</b>, so cost per 1k pages fell <b>18%</b>. The B200 reservation is paid either way.</div></div><div class="impact-card"><div class="ic-value">Utilization per B200 fell because capacity rose <b>50%</b> and pages <b>20%</b>.</div></div><div class="impact-card"><div class="ic-value">The 11-18 peak (<b>22.5M</b> pages) still sent <b>6.0%</b> of fpp-35b calls to Modal (<b>$6.3K</b> of fpp-flash that day).</div></div></div>

## PRs

<div class="pr-grid"><a class="pr-chip open" href="https://github.com/reductoai/api/pull/14399"><b>#14399</b><span>open</span><em>Day one: rollouts that fit a full pool. fpp-35b maxSurge 0 / maxUnavailable 1 (from…</em></a><a class="pr-chip merged" href="https://github.com/reductoai/api/pull/14403"><b>#14403</b><span>merged</span><em>Day one: start on the current image. If #14403 (R-1 on Overshoot 1109, vLLM 0.31) is…</em></a><a class="pr-chip open" href="https://github.com/reductoai/api/pull/14779"><b>#14779</b><span>open</span><em>🟢 Done. usw3 is a full router head for fpp-35b, fpp-2b and maverick: live /capacity…</em></a><a class="pr-chip open" href="https://github.com/reductoai/api/pull/14405"><b>#14405</b><span>open</span><em>PR: #14405. Network plan: 16 to add, 1 in-place (proxy firewall), 0 to destroy.</em></a><a class="pr-chip merged" href="https://github.com/reductoai/api/pull/14438"><b>#14438</b><span>merged</span><em>2026-11-10 18:33 PT The gke apply failed: Master version "1.35.5-gke.1000000" is…</em></a><a class="pr-chip open" href="https://github.com/reductoai/api/pull/14440"><b>#14440</b><span>open</span><em>2026-11-10 19:33 PT gke re-applied for #14440: managed DCGM is off on usw3 and the NVIDIA…</em></a><a class="pr-chip open" href="https://github.com/reductoai/api/pull/14451"><b>#14451</b><span>open</span><em>2026-11-10 19:33 PT gke re-applied for #14440: managed DCGM is off on usw3 and the NVIDIA…</em></a><a class="pr-chip open" href="https://github.com/reductoai/api/pull/14434"><b>#14434</b><span>open</span><em>2026-11-10 19:33 PT gke re-applied for #14440: managed DCGM is off on usw3 and the NVIDIA…</em></a><a class="pr-chip open" href="https://github.com/reductoai/api/pull/14409"><b>#14409</b><span>open</span><em>PR: #14409</em></a><a class="pr-chip open" href="https://github.com/reductoai/api/pull/14572"><b>#14572</b><span>open</span><em>The fix is PR https://github.com/reductoai/api/pull/14572 (namespace list becomes a…</em></a><a class="pr-chip open" href="https://github.com/reductoai/api/pull/14738"><b>#14738</b><span>open</span><em>2026-11-12 16:41 PT gke re-apply added the 4-node b200 pool. dcgm-exporter fixed by…</em></a><a class="pr-chip merged" href="https://github.com/reductoai/api/pull/14428"><b>#14428</b><span>merged</span><em>2026-11-12 16:41 PT #14428 merged; promote pinned usw3 at 2cde93b at 16:53. 2026-11-12…</em></a><a class="pr-chip merged" href="https://github.com/reductoai/api/pull/14754"><b>#14754</b><span>merged</span><em>2026-11-12 16:41 PT #14428 merged; promote pinned usw3 at 2cde93b at 16:53. 2026-11-12…</em></a><a class="pr-chip merged" href="https://github.com/reductoai/api/pull/14431"><b>#14431</b><span>merged</span><em>2026-11-12 17:43 PT #14431 merged (usw3 in the GKE B200 monitors). 2026-11-12 18:09 PT…</em></a><a class="pr-chip merged" href="https://github.com/reductoai/api/pull/14756"><b>#14756</b><span>merged</span><em>2026-11-12 17:43 PT #14431 merged (usw3 in the GKE B200 monitors). 2026-11-12 18:09 PT…</em></a><a class="pr-chip open" href="https://github.com/reductoai/api/pull/14746"><b>#14746</b><span>open</span><em>2026-11-12 18:03 PT #14746 router target at cap 0. 2026-11-12 18:30 PT #14748 step 1 caps…</em></a></div>

## Details

<details>
<summary>Overview</summary>

# Summary

</details>

<details>
<summary>Problem</summary>

- We accepted a GCP B200 reservation in us-west3 that comes online Thursday 2026-11-12. We need a GKE cluster ready to put it to work.
- Reservation <code>nvidia-b200-bn2td2z7kxx17</code>: zone <code>us-west3-c</code>, <code>a4-highgpu-8g</code> (8 B200 per node), DENSE, created 2026-11-10 14:31 PT, ends 2029-11-13. Today it shows 0 nodes and no block yet.
- Project quota in us-west3 is free: 3,000 CPUs, 750 N2 CPUs (system nodes), nothing used.

</details>

<details>
<summary>Solution</summary>

- Copy uss1 as a third GCP cluster, <code>prod-gpu-usw3</code>, with its own direct hostname <code>gcp-inference-usw3.platform.reducto.ai</code> and router provider <code>gcp_usw3</code>.
- Build everything except the GPU pool now. The <code>gcp-gke</code> module leaves out the <code>b200</code> node pool until the reservation has a block, so the same Terraform apply adds the 4 GPU nodes on Thursday.
- Include the Snapshot cluster prerequisites like uss1 (Filestore CSI, the <code>filestore-zonal-rwx</code> storage class, the <code>snapshot</code> namespace), but no Snapshot workers. Leave out the rest we don't need: no multi-cluster gateway or fleet hop (the router calls each cluster's direct hostname), no Triton.
- 5 PRs: Terraform, Flux root, models on, monitors, router cutover. Traffic only moves in the last one, after a dev-style smoke on the direct hostname.

# Goodies (not on use1/uss1 today)

- <b>Day one: node-local cache on every Dynamo worker.</b> Today an fpp-35b worker took 16.6 min to Ready on uss1 (cache off, 2026-11-10 14:40 PT to 14:57) and about 3 min on use1 (cache on). The quack autotune alone is about 700 s of a cold start. This is the uss1 slowness, so usw3 starts with it on.
- <b>Day one: rollouts that fit a full pool.</b> fpp-35b <code>maxSurge 0</code> / <code>maxUnavailable 1</code> (from [#14399](https://github.com/reductoai/api/pull/14399)), so a promote never waits on GPUs the HPAs already took.
- <b>Day one: start on the current image.</b> If [#14403](https://github.com/reductoai/api/pull/14403) (R-1 on Overshoot 1109, vLLM 0.31) is merged by then, usw3 starts on it and never rolls from the old one.
- <b>Day one: monitors that know the cluster count.</b> 31 Datadog monitor files hard-code the use1/uss1 cluster list, and two of them alert below 4 GPU nodes / 32 GPUs. Adding usw3 to those lists is part of the plan (step 5).
- <b>Soon, all three clusters: Flux over a GitHub App instead of an SSH deploy key.</b> Our Flux (source-controller v1.8) supports GitHub App auth on the GitRepository. It removes the single deploy key that blocked every promote for about a day. Needs a repo admin to install the App, so it is a follow-up, not a Thursday blocker.
- <b>Separate PR: right-size fpp-35b floors.</b> The registry floors (<code>min_replicas: 16</code>, peak 18) were sized at 8 seats per worker; workers now take 16 to 20. The floor is one value for every cluster in <code>hosts.cluster</code>, so usw3 inherits it. Fix it once, for all clusters, in its own PR.
- <b>Only if a cold node shows it: GKE image streaming on the b200 pool.</b> Image pull is not the big part of the 16 min today, so measure first.
- <b>Skip for now:</b> Snapshot workers (the cluster pieces are in PR 1) and multi-cluster gateway membership. Managed DRANET was added to PR 1 after all, because GKE sets its node label only when it creates the pool.

# Decisions for Jean (defaults in bold)

- Reservation size: <b>4 nodes (32 B200), like use1/uss1</b>. The module hard-codes <code>node_count = 4</code>; another size means a variable.
- Models on usw3: <b>same as uss1 (maverick, fpp-35b, fpp-2b), without the pilots</b>.
- Flux auth on Thursday: <b>the same deploy key as use1/uss1</b>, GitHub App as a follow-up for all three.
- Cluster role: <b>a standalone cluster on the router, like uss1</b>, not a member of the global multi-cluster gateway.

# Current status

- 🟢 Done. usw3 is a full router head for fpp-35b, fpp-2b and maverick: live <code>/capacity</code> slots and <code>lane_dynamo</code> since 2026-11-12 21:16 PT ([#14779](https://github.com/reductoai/api/pull/14779)). Jean confirmed it takes traffic on 2026-11-19 09:49 PT. In the last 5 days it served 41% of fpp-35b router calls.
- 🟢 4/4 B200 nodes, 32 GPUs reporting DCGM to Datadog (checked 2026-11-19 10:30 PT).
- 🟡 One follow-up open: Flux GitHub App auth (step 7).

# Steps 🟢/🟡/🔴

<details>
<summary>🟢 0. Decisions (today)</summary>

- Jean answers the 4 decisions above. Any default he doesn't change stands.
- Logs
  - 2026-11-10 15:20 PT Agent wrote the plan. Reservation read from <code>gcloud compute reservations describe</code>; startup times from the uss1/use1 fpp-35b worker pods.
  - 2026-11-10 17:30 PT Jean kept all 4 defaults. He also decided:
    - no shared gateway for usw3;
    - no <code>inference</code> namespace or Triton (the storage class moved into <code>dynamo-pilot</code>, and the usw3 <code>inference-foundation</code> unit was dropped);
    - managed DRANET is on before the B200 pool exists;
    - Datadog container logs stay off.

</details>

<details>
<summary>🟢 1. PR 1: Terraform for us-west3 (Agent; Jean applies Wednesday)</summary>

- Work
  - <code>global/prod-gpu/network</code>: add a <code>usw3</code> region. Proposed ranges, all unused in the project today: primary <code>10.240.48.0/20</code>, proxy-only <code>10.241.4.0/23</code>, pods <code>10.66.0.0/16</code>, services <code>10.96.32.0/20</code>, gVNIC <code>10.250.2.0/24</code>, master <code>172.16.0.32/28</code>, zone <code>us-west3-c</code>, reservation <code>nvidia-b200-bn2td2z7kxx17</code>.
  - New <code>reducto-gcp/us-west3/</code> with <code>region.hcl</code> and the uss1 units, Snapshot cluster pieces included (<code>enable_filestore_csi</code>, Filestore storage class with its NFS export on <code>10.240.48.0/20</code>, <code>snapshot_namespace</code>): <code>gke</code>, <code>gke-rdma-config</code>, <code>dynamo-pilot</code> (namespaces and HF token), <code>inference-foundation</code>, <code>inference-edge</code> (no multi-cluster backend or export), <code>dynamo-direct-access</code> (hostname <code>gcp-inference-usw3</code>, Route 53), <code>cluster-observability</code>, <code>flux-gitops</code>. Scalr <code>stacks.json</code> comes from the pre-commit hook.
- PR: [#14405](https://github.com/reductoai/api/pull/14405). Network plan: 16 to add, 1 in-place (proxy firewall), 0 to destroy.
- Apply order (Jean, Scalr): network, then gke (system pool only until Thursday), then the add-ons. <code>flux-gitops</code> waits for PR 2 to merge.
- Done when: the cluster is up with system nodes, <code>/edge-healthz</code> on the new hostname answers 200.
- Logs
  - 2026-11-10 17:59 PT #14405 merged.
  - 2026-11-10 18:00 PT The network apply failed with GCP 403s: <code>scalr-runner@reducto-mle</code> could not create networks, subnets or routers, or update firewalls. Nothing was created. Jean granted the roles, and the re-run applied at 18:24.
  - 2026-11-10 18:33 PT The gke apply failed: <code>Master version "1.35.5-gke.1000000" is unsupported</code>. The module had pinned that version since June, and GKE no longer creates clusters on it. Fixed in [#14438](https://github.com/reductoai/api/pull/14438), which makes it a variable (use1/uss1 unchanged) and sets usw3 to <code>1.35.8-gke.1975000</code>, the newest 1.35 on Regular. Merged 18:44.
  - 2026-11-10 18:46 PT The gke apply failed again, on 403 <code>gkehub.memberships.create</code>: the module registers every cluster to the Fleet. Nothing was created. Jean granted <code>roles/gkehub.editor</code>.
  - 2026-11-10 19:03 PT gke applied, 2 added: the cluster and the system pool. <code>b200_node_pool_created = false</code>, as expected.
  - 2026-11-10 19:07 PT <code>gke-rdma-config</code>, <code>dynamo-pilot</code>, <code>inference-edge</code> and <code>dynamo-direct-access</code> applied. direct-access added 11 resources: the global IP <code>136.68.5.126</code>, the managed certificate, the SSL policy, the Gateway, Envoy and the Route 53 record.
  - 2026-11-10 19:33 PT gke re-applied for [#14440](https://github.com/reductoai/api/pull/14440): managed DCGM is off on usw3 and the NVIDIA dcgm-exporter chart is used, so the XID and row-remap monitors get data. The exporter install fix is [#14451](https://github.com/reductoai/api/pull/14451). Envoy failed-request logs to Datadog came in separately with [#14434](https://github.com/reductoai/api/pull/14434).
  - 2026-11-11 11:06 PT <code>cluster-observability</code> applied (dcgm-exporter).
  - 2026-11-11 19:35 PT <code>/edge-healthz</code> on <code>gcp-inference-usw3</code> returns 404. That's expected: the route comes from the inference-models chart, so it answers once Flux runs on usw3 (step 2).
  - 2026-11-11 19:40 PT Jean gave the go: re-apply <code>gke</code> once the reservation has a block (the 4-node b200 pool appears), then <code>gke-rdma-config</code>. Checked: there's no block yet. The reservation is READY with count 0, 0 blocks and 0 healthy blocks. No B200 nodes are attached: the cluster has only the <code>system</code> pool and 3 <code>n2-standard-8</code> VMs. Both applies are on hold until a block shows up.

</details>

<details>
<summary>🟢 2. PR 2: Flux root and cluster values, models off (Agent)</summary>

- Work
  - <code>clusters/gpu-inference/prod-gpu-usw3/</code> (sources, platform, inference-models), cluster value files for <code>dynamo-platform</code>, <code>inference-platform</code> and <code>inference-models</code>, with every model <code>enabled: false</code>. Models stay off until GPUs exist, or the HelmRelease waits on Pending pods and times out.
  - <code>helm-lint.yml</code> matrix loops. The rest of the rollout tooling (<code>scripts/flux_rollout_config.py</code>, <code>flux-rollout*.yml</code>, both <code>deploy.sh</code>) moved to PR 3: until Flux is bootstrapped on usw3, adding it to the <code>all</code> rollout would fail every promote on push to main, and <code>deploy.sh</code> needs the new cluster's kube-system UID.
  - PR: [#14409](https://github.com/reductoai/api/pull/14409)
- Then Jean applies <code>flux-gitops</code>. Done when: Flux is Ready on usw3 and the platform releases (Dynamo operator, KEDA, Prometheus) are deployed.
- Logs
  - 2026-11-10 17:50 PT Merged main into #14409 (no conflicts) and then into #14428. CI is green on both.
  - 2026-11-11 19:30 PT Codex's comment (missing usw3 dynamo-platform/keda/prometheus values in the helm-lint loop) was already fixed in 701b251673. Replied and resolved. helm-lint passes on the head, and no review threads are open. Ready for Jean.
  - 2026-11-11 19:45 PT Jean approved #14409 and it merged. No <code>flux-gitops</code> run was queued, so Jean starts it from the workspace.
  - 2026-11-11 19:55 PT Brought #14428 and #14431 up to date with main. This took in three changes from main:
    - #14419 lowered the fpp-35b floor from 16 to 6, so usw3's <code>protectedFloor</code> is now 11 (4 + 6 + 1), as on use1.
    - #14461 rolled the GCP heads back from Overshoot 1109, so usw3 fpp-35b runs the default fold-44 engine on the vLLM 0.33 runtime (<code>f2c4bf2b</code>), with no usw3 serving pick.
    - #14439 added the <code>gpu_node_cordoned</code> and <code>xid_telemetry_missing</code> monitors. usw3 is added to both, so #14431 now covers 21 monitors.

    <p>
    Helm, rollout and capacity tests pass locally.

    - 2026-11-11 20:05 PT Devin Review findings handled:
    - #14428: the description was stale; it's rewritten.
    - #14431: the XID-telemetry monitor message now says usw3 sends XID counts through its dcgm-exporter.

    Finding: #14434 (merged 11-10 18:36) already turned on Datadog log collection on use1, uss1 and usw3 for the Envoy failed-request logs. That replaces the earlier "Datadog logs off" decision; #14431's description now says so.

    - 2026-11-11 19:47 PT Jean applied <code>flux-gitops</code> (run-v0pg0o6hhmifar49j). The run errored on one resource: <code>load_summary_redis["inference"]</code> failed with <code>namespaces "inference" not found</code>, because the module hard-codes the Triton namespace and usw3 has no Triton.

    Flux itself is up and reconciling. Checked with kubectl:

    - GitRepository <code>api</code> and Kustomization <code>gpu-inference</code> are Ready at main@e6ad539.
    - keda, prometheus, dynamo-platform, dynamo-platform-config and inference-models are all installed, with models off.

    The fix is PR [https://github.com/reductoai/api/pull/14572](https://github.com/reductoai/api/pull/14572) (namespace list becomes a variable; usw3 = dynamo-serving only). After it merges, re-run flux-gitops.

    - 2026-11-11 19:58 PT reducto-review ran on bab97c4717 (#14431) and #14572 with no findings. #14572's CI is green, and its Scalr plans show nothing for load\_summary\_redis:
    - usw3: no changes.
    - use1/uss1: namespace-annotation noise.
    - usw1: un-applied rollout RBAC from earlier.

    #14428 and #14431 went to Jean for review.

    - 2026-11-11 20:05 PT #14572 merged, and Jean re-ran flux-gitops (run-v0pg0oqfdjsgthopq). It planned no changes and finished without an apply; the merge's VCS run was the same. The errored run had already created everything usw3 needs, and the <code>inference</code> secret is no longer in config.

    Checked with kubectl:

    - Flux: the 6 controllers are Running. GitRepository <code>api</code> and Kustomization <code>gpu-inference</code> are Ready at main@e6ad539.
    - HelmReleases: keda, prometheus, dynamo-platform, dynamo-platform-config and inference-models are all Ready.
    - <code>dynamo-serving/load-summary-redis</code> exists, and no pods are failing.

    flux-gitops is done for usw3.

    - 2026-11-12 11:00 PT Answered and resolved #14428's 2 open Codex threads:
    - Image-mirror test fixtures: already fixed in 3bf6fa2f/812f3bf5, and the 12 tests pass.
    - usw3 in GPU monitors: covered by #14431.

    No code change, so no push.

    - 2026-11-12 16:35 PT The reservation is fulfilled: count 4, 1 healthy block, 0 in use. The cluster still has only the system pool. Sent Jean the apply order:

    1. gke re-apply, to add the 4-node b200 pool.
    2. Verify the nodes and GPUs.
    3. gke-rdma-config (should plan no changes).
    4. Merge #14428 and promote Flux to usw3.
    5. Merge #14431 and apply datadog/monitors.

    - 2026-11-12 16:41 PT gke re-apply run-v0pg1r7dmv8i86jmq applied: +1 (b200 pool), 0 changed. 4 b200 nodes are Ready, 32 GPUs allocatable, and nccl-rdma-installer is running on all 4. Jean merged #14428.
    - Finding: usw3's GitRepository is not commit-pinned (branch main only; use1 and uss1 are pinned), so Flux follows main by itself. Sent Jean the usw3-only promote with allow\_unpinned\_current=true, target 2cde93bbce.
    - Finding: dcgm-exporter is in CrashLoopBackOff on all b200 nodes (exit 1, no log).
    - 2026-11-12 16:48 PT First promote failed: no RBAC for github-flux-rollout@ on usw3. use1 and uss1 have a hand-made ClusterRoleBinding <code>github-flux-rollout-cluster-admin</code>, which is not in Terraform. Jean created the same binding on usw3 (my identity is read-only). Second promote failed because allow\_unpinned\_current wasn't set. Sent Jean the re-run command.
    - 2026-11-12 16:55 PT dcgm-exporter cause: the startup check runs <code>ldconfig -p</code>, and the distroless image has no /etc/[ld.so](http://ld.so).cache on GKE, so it exits 1. Fix in PR #14738 (DISABLE\_STARTUP\_VALIDATE=true). After it merges, apply usw3 cluster-observability.
    - Updated #14431 to main. Its diff is now only the 21 monitor files, which settles its Devin Review flag.
    - 2026-11-12 16:53 PT Third promote (run 43340344144, allow\_unpinned\_current) pinned usw3: spec.ref.commit = 2cde93b, so usw3 no longer follows main. The 3 DGDs were created, and the workers are pulling weights from HF (cold nodes).
    - 2026-11-12 17:10 PT Traffic cutover plan for Jean's sign-off: [Milestone: usw3 traffic cutover](https://app.notion.com/p/4174a78a1c87818ea6ebef8a44cdf597). No gcp\_usw3 PR until it's signed off.
    </p>

</details>

<details>
<summary>🟢 3. GPUs online (Thursday, Jean)</summary>

- Re-apply <code>gke</code> once the reservation has a block: the <code>b200</code> pool appears with 4 nodes. Then <code>gke-rdma-config</code>.
- Checks (Agent, read-only): 32 <code>nvidia.com/gpu</code> allocatable, DCGM metrics and the Datadog agent reporting for <code>prod-gpu-usw3</code>.
- Logs
  - 2026-11-12 16:41 PT gke re-apply added the 4-node b200 pool. dcgm-exporter fixed by [#14738](https://github.com/reductoai/api/pull/14738) (2026-11-12 17:15 PT). Since 11-13 Datadog has DCGM data for all 32 GPUs.

</details>

<details>
<summary>🟢 4. PR 3: models on usw3 (Agent; Jean promotes off-peak)</summary>

- Work: rollout tooling (<code>flux_rollout_config.py</code> <code>CLUSTERS</code>/<code>CLUSTER_ORDER</code>, <code>flux-rollout*.yml</code>, both <code>deploy.sh</code> with the kube-system UID); add <code>prod-gpu-usw3</code> to <code>hosts.cluster.clusters</code> in the maverick, R-1 and R-1 mini records, <code>uv run rd gen inference-values</code>, the usw3 cluster file with node-local cache on every worker and fpp-35b <code>maxSurge 0</code>, and <code>protectedFloor</code> and the capacity test.
- Smoke before any traffic: keyed calls to <code>/fpp-35b</code>, <code>/fpp-2b</code> and <code>/maverick</code> on <code>gcp-inference-usw3</code>, plus a short pages/s check at 16 in flight against uss1.
- Done when: all workers are Ready and the smoke passes.
- Logs
  - 2026-11-12 16:41 PT [#14428](https://github.com/reductoai/api/pull/14428) merged; promote pinned usw3 at 2cde93b at 16:53. 2026-11-12 19:06 PT [#14754](https://github.com/reductoai/api/pull/14754) reserved the 32 B200 as R-1 27, R-1 mini 1, maverick 4 (R-1 floor now 25, R-1 mini 3).

</details>

<details>
<summary>🟢 5. PR 4: monitors and fleet lists (Agent; Jean applies)</summary>

- Add usw3 to the 31 <code>gpu_inference_*</code> monitor definitions and <code>log_metrics.tf</code>, <code>dynamo-image-mirror.yml</code> (weekly CVE scan), <code>scripts/gpu_allocation_export.py</code>, the local runner deny list and the COGS fleet doc.
- Lands before step 6, so the cluster is watched before it takes traffic.
- Logs
  - 2026-11-12 17:43 PT [#14431](https://github.com/reductoai/api/pull/14431) merged (usw3 in the GKE B200 monitors). 2026-11-12 18:09 PT [#14756](https://github.com/reductoai/api/pull/14756) counts <code>gcp_usw3</code> as a head in the decode-speed drift monitors.

</details>

<details>
<summary>🟢 6. PR 5: router cutover (Agent; Jean dispatches the router deploy)</summary>

- Add <code>gcp_usw3</code> to <code>lib/ml_router/orchestration.prod.yaml</code> (provider and cluster), <code>helm-charts/inference-router/values/prod.yaml</code> (tier 1 for each namespace), <code>services/router_controller/config.prod.yaml</code> (capacity URLs) and <code>lms/inference_router/router.prod.yaml</code> (<code>lane_dynamo</code>).
- The router API key already exists, so no key work is needed.
- Done when: usw3 serves router traffic at its slots and spill to Modal looks normal.
- Logs (gate details in the milestone page below)
  - 2026-11-12 18:03 PT [#14746](https://github.com/reductoai/api/pull/14746) router target at cap 0. 2026-11-12 18:30 PT [#14748](https://github.com/reductoai/api/pull/14748) step 1 caps 20/42/44. The half-cap step was skipped.
  - 2026-11-12 20:04 PT [#14769](https://github.com/reductoai/api/pull/14769) live <code>/capacity</code> (full). 2026-11-12 21:16 PT [#14779](https://github.com/reductoai/api/pull/14779) <code>lane_dynamo</code>.
  - 2026-11-19 09:49 PT Jean confirmed usw3 takes traffic. Done.

</details>

<details>
<summary>🟡 7. Follow-ups for all three clusters (open only)</summary>

- Flux GitHub App auth. No PR yet. All three clusters still use the SSH deploy key <code>FLUX_GIT_DEPLOY_KEY</code> (<code>terragrunt/modules/kubernetes-flux-gitops</code> on main). Needs a repo admin to install the App.

</details>

# Alerts and logs: what question each one answers

Checked on 2026-11-10 against <code>main</code> and live Datadog. The usw3 column is what [#14431](https://github.com/reductoai/api/pull/14431) added (merged 2026-11-12 17:43 PT). usw3 has sent DCGM telemetry since 11-13.

</details>

<details>
<summary>Can we pick which logs we send?</summary>

Yes, and we already do, in two places.

- <b>Datadog.</b> The agent only reads logs from a container that has an <code>ad.datadoghq.com/<container>.logs</code> annotation (<code>containerCollectAll = false</code>), and only in the namespaces listed in <code>log_namespace_allowlist</code>. Each cluster turns collection on with <code>enable_log_collection</code>. It is on for usw1 and off (the default) for use1, uss1 and usw3. To cut further, add <code>log_processing_rules</code> (<code>exclude_at_match</code> / <code>include_at_match</code>) to one container's annotation. The agent then drops those lines before it sends them. A Datadog index exclusion filter also works, but we still pay to ingest the lines.
- <b>GCP Cloud Logging.</b> The <code>gcp-gke</code> module turns on <code>WORKLOADS</code> logging, so every container's stdout on use1, uss1 and usw3 goes to Cloud Logging (not Datadog). To pick there, add an exclusion filter to the <code>_Default</code> sink, or drop <code>WORKLOADS</code>.
- <b>What arrives in Datadog today:</b> 10 log lines from the GPU clusters in the last 15 days, all from usw1 (<code>service:triton-load-summary</code>). Nothing from use1 or uss1.

</details>

<details>
<summary>Alerts</summary>

All of these page through [incident.io](http://incident.io) unless noted.

| Alert | Question it answers | Clusters on main | usw3 |
| --- | --- | --- | --- |
| <b>Hardware</b> |  |  |  |
| GPU XID errors | Did a GPU throw a driver or hardware fault? | use1, uss1, usw1 | yes |
| GPU row remap failure | Is a GPU's memory failing for good (replace the GPU)? | use1, uss1, usw1 | yes |
| DCGM telemetry missing | Did we lose GPU metrics, so the GPU alerts are blind? | use1, uss1, usw1 | yes |
| Node not ready | Is any node in the cluster down? | use1, uss1, usw1 | yes |
| GCP ready GPU nodes below 4 | Did the cluster lose a B200 node? | use1, uss1 | yes |
| GPU allocatable below 32 | Can Kubernetes schedule work on all 32 GPUs? | use1, uss1 | yes |
| <b>Kubernetes and capacity</b> |  |  |  |
| Serving pods pending | Is a non-worker pod (frontend, Envoy, operator, KEDA) stuck unscheduled? | use1, uss1, usw1 | yes |
| Serving deployment has unavailable replicas | Is a non-worker deployment short of replicas? | use1, uss1, usw1 | yes |
| Dynamo worker pending above burst backlog | Are more GPU workers waiting than a normal burst leaves? | use1, uss1, usw1 | yes |
| Dynamo worker containers failing | Is a worker crash-looping or failing to pull, not just booting? | use1, uss1, usw1 | yes |
| HPA at maximum replicas | Has maverick run out of room to scale? (fpp-35b and fpp-2b are excluded) | use1, uss1 | yes |
| Dynamo autoscaler missing | Did a model's KEDA HPA disappear (for example a paused ScaledObject)? | use1, uss1 | yes |
| <b>Dynamo and vLLM</b> |  |  |  |
| Dynamo telemetry missing | Did we lose Dynamo metrics, so the serving alerts are blind? | use1, uss1 | yes |
| Dynamo transport errors | Are frontends failing to reach workers? | use1, uss1 | yes |
| Dynamo request-plane inflight sustained | Are requests piling up inside a cluster for 10 minutes? | use1, uss1 | yes |
| vLLM deployment completed rate dropped vs an hour ago | Did a model's throughput on a cluster collapse? | use1, uss1, usw1 | yes |
| vLLM worker completed rate below peers | Is one worker serving far less than its siblings (stuck worker)? | use1, uss1, usw1 | yes |
| <b>Edge</b> |  |  |  |
| Envoy 5xx responses | Is the cluster's front door returning errors? | use1, uss1, usw1 | yes |
| Envoy no healthy upstream | Does Envoy have nowhere to send a model's traffic? | use1, uss1, usw1 | yes |
| <b>Triton</b> |  |  |  |
| Triton telemetry missing, completed rate drop, pod below peers, zero ready pods | Same questions for the Triton pools | use1, uss1, usw1 (only usw1 runs Triton) | not needed |
| <b>Caller side (API </b><b><code>model.call</code></b><b> spans, by </b><b><code>backend_target</code></b><b>)</b> |  |  |  |
| Model decode speed below half of last week | Did any model get 2x slower on any backend? | every backend | yes, once <code>gcp_usw3</code> takes traffic |
| R-1 and R-1 mini Modal spill vs cluster heads | Is the Modal spill much slower than the clusters? | <code>gcp_use1</code>, <code>gcp_uss1</code> | <b>no</b> |
| Maverick Modal vs cluster drift | Same for maverick | <code>gcp_use1</code>, <code>gcp_uss1</code> | <b>no</b> |
| <b>Inference router</b> |  |  |  |
| GCP cap is 0 | Has the router stopped sending to a GCP cluster? | any <code>gcp_*</code> cluster | yes, no edit |
| Router errors, cluster down, provider 401/403, smoke failed | Is the router failing to reach a cluster? | by router <code>cluster</code> label | yes, no edit |

</details>

<details>
<summary>Logs</summary>

| Log stream | Question it answers | State |
| --- | --- | --- |
| Envoy access logs in <code>inference-edge-system</code>, feeding 6 log metrics in <code>log_metrics.tf</code> (<code>reducto.gpu_inference.*</code>, <code>reducto.triton_inference.*</code>) | How many chat-completion requests did each cluster take, by model and status? How many did Envoy forward? How many did it reject without trying a backend, and why (response flags)? | <b>Dead.</b> No data in the last 30 days, because no Envoy pod has a logs annotation and GCP collection is off. No monitor reads these metrics. The filters list use1, uss1, usw1, not usw3. |
| Triton load summary (usw1, <code>source:triton-startup</code>) | Did Triton load all its models at startup? | Working. The only GPU-cluster log stream in Datadog. |
| GKE Cloud Logging (all containers, API server, scheduler) | Anything, when we dig by hand in the GCP console | On for every GCP cluster. Nothing alerts on it. |

</details>

<details>
<summary>Gaps</summary>

1. <b>No request logs from any GCP cluster in Datadog.</b> So Datadog cannot tell us which requests failed and why. The <code>envoy_http_downstream_rq_xx</code> metric gives the 5xx count but not the response flag or model. Smallest fix: set <code>enable_log_collection = true</code> on use1, uss1 and usw3, and annotate only the Envoy container with a rule that keeps non-2xx lines. Otherwise delete the 6 dead log metrics.
2. <b>Spill-vs-heads decode monitors stop at use1 and uss1.</b> They are pinned to <code>backend_target IN (gcp_use1, gcp_uss1)</code> and to the head model names (<code>fpp_35b_0912</code>, <code>fpp_2b_nvfp4_20261023</code>). #14431 does not change them. After the cutover, usw3 traffic is not counted. A model rename quietly turns them off, because the low-volume guard then holds them silent.
3. <b>No per-cluster latency alert.</b> Nothing alerts on time to first token or queue time per cluster. We only have decode speed vs last week (all clusters together) and request-plane inflight.
4. <b>No KV cache alert.</b> No monitor reads vLLM KV cache usage, so a cluster that is close to preempting requests shows only as slower decode.
5. <b>No Flux alert.</b> No monitor reads Flux or HelmRelease state, so a promote that fails to reconcile does not page.
6. <b>The GPU XID alert is blind.</b> <code>DCGM_FI_DEV_XID_ERRORS</code> (and <code>DCGM_EXP_XID_ERRORS_COUNT</code>) has had no series in Datadog from any cluster in 30 days, while other DCGM metrics arrive. Both are in the Datadog allowlist, so the exporters probably don't emit XID. The monitor stays OK on no data and has never fired.
7. <b>R-1 pools have no at-max alert.</b> The HPA-at-max monitor excludes fpp-35b and fpp-2b, so a full R-1 pool shows only as pending pods or spill to Modal.

- [Milestone: usw3 traffic cutover (plan for sign-off)](https://app.notion.com/p/4174a78a1c87818ea6ebef8a44cdf597)

</details>

<details>
<summary>Impact</summary>

Before: 5 days 2026-11-06 16:00 PT to 2026-11-11 16:00 PT (Sat to Wed, no usw3). After: the same weekdays one week later, 2026-11-13 16:00 PT to 2026-11-18 16:00 PT (usw3 a full head). Datadog and Modal days are UTC, so they start at 16:00 PT. Measured 2026-11-19 10:30 PT.

| Metric | Before | After | Change | Source |
| --- | --- | --- | --- | --- |
| B200 GPUs on the router heads | 64 (use1, uss1) | 96 (+ usw3) | +50% | Datadog <code>DCGM_FI_DEV_GPU_UTIL</code> by host and gpu: 32 GPUs per cluster |
| B200 GPU utilization, mean | 23.5% (use1 23.6, uss1 23.4) | 16.8% (use1 15.6, uss1 15.6, usw3 19.1) | −6.7 pts | <code>avg:DCGM_FI_DEV_GPU_UTIL</code> by <code>kube_cluster_name</code>, daily means |
| Busy B200s (GPUs × utilization) | 15.0 | 16.1 | +7% | same |
| Modal prod spend | \$87.5K (\$17.5K/day) | \$58.0K (\$11.6K/day) | −34% | <code>modal billing report</code>, env <code>prod</code>, one day at a time |
| Modal R-1 app (<code>fpp-flash</code>) spend | \$31.1K | \$9.5K | −69% | same, app <code>fpp-flash</code> |
| fpp-35b Modal share of router calls | 9.4% | 3.4% (usw3 41.0%) | −6.0 pts | <code>router.upstream.status{namespace:fpp-35b}</code> by <code>cluster</code> |
| Prod pages | 50.0M | 59.8M | +20% | <code>sum:num_pages{deployment.environment:prod}</code> |
| GPU cost per 1k pages | \$2.95 | \$2.43 | −18% | (B200s × \$7.09/h + 8 H200 × \$5.721/h + Modal prod) ÷ prod pages; rates from cogs GPU\_[FLEET.md](http://FLEET.md) |
| fpp-35b <code>model.call</code> p99 / p50 | 6,872 / 987 ms | 4,426 / 825 ms | p99 −36% | APM spans <code>model.call</code>, <code>@model:reducto/fpp_35b_0912</code>, pc99/pc50 of <code>@duration</code> |
| fpp-35b p99 by backend | use1 4,252, uss1 4,168, Modal 26,245 ms | use1 3,623, uss1 3,552, usw3 3,925, Modal 18,680 ms |  | same, by <code>@backend_target</code> |

- Modal fell while pages rose 20%, so cost per 1k pages fell 18%. The B200 reservation is paid either way.
- Utilization per B200 fell because capacity rose 50% and pages 20%.
- The 11-18 peak (22.5M pages) still sent 6.0% of fpp-35b calls to Modal (\$6.3K of <code>fpp-flash</code> that day).

</details>

