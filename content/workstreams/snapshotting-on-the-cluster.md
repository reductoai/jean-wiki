# Snapshotting on the cluster

Goal: a GPU-checkpointed fpp-35b worker on uss1 comes back from a checkpoint instead of a 3-17 min cold start (restore ~2 min today, ~10 s is the target: Restore toward 10 s: plan (fpp-35b on uss1)). One PR per step; uss1 only.

{{dashboard:snapshotting-on-the-cluster}}

## Details

<details>
<summary>Plan</summary>

Goal: a GPU-checkpointed fpp-35b worker on uss1 comes back from a checkpoint instead of a 3-17 min cold start (restore \~2 min today, \~10 s is the target: <a href="https://app.notion.com/p/4174a78a1c878110b429c03cf77d1007">Restore toward 10 s: plan (fpp-35b on uss1)</a>). One PR per step; uss1 only.

Live today: fpp-35b on uss1 only. Restore \~24 s from the node SSD (\~3 min on a node's first read from Filestore) vs 3–17 min cold start; capture \~20 min per template change, on every node \~4 min later. Not covered: fpp-2b live, Maverick, use1/usw1/usw3.

1. Done 11-17 11:45 AM PT (Logs): pruner promoted to all clusters in dry run; first run kept the 3 live checkpoints, nothing to delete.
2. Done 11-17 5:00 PM PT (Logs): pruner deletes on ([#15210](https://github.com/reductoai/api/pull/15210)); first run removed exactly the superseded pilot checkpoint.
3. Capture commit: still \~19–20 min for a 65 GiB image after [#15157](https://github.com/reductoai/api/pull/15157) (direct writes). Measured 11-17 with random data: the 1 TiB Zonal share writes \~60 MB/s per node in every mode and with 2–4 writers (zeros write 2× faster because Filestore compresses them — the earlier 120 MB/s was a zero-data artifact). Floor at 1 TiB; Jean's pick pending: Zonal 3 TiB resize (+\$512/mo, re-measure), accept, or the smaller image (step 5); revert the PageBroker patch to the upstream mirror either way. Jean (11-17): keep the share at 1 TiB, no Scalr change — \~10 min is the capture floor until the image shrinks (step 5). For the record, a bigger share would have given: Zonal 3 TiB \$768/mo (+\$512) → 260 MiB/s, \~5 min; Basic SSD 2.5 TiB \$768 → 350 MiB/s, \~3.6 min; Zonal 10 TiB \$2,560 → 800 MiB/s, \~1.6 min.
4. Parked until sleep level 2 is back: CRIU lazy pages. The chart's <code>criu.lazyPages</code> is dump-only (post-copy, needs a page server; the agent has no restore-side support), so it needs an agent patch (lazy-pages daemon over the node-cache image, pilot-gated). A cache-hit restore today is \~24 s: container \~3 s, CRIU read 11–12 s, CUDA restore \~8 s, probes \~2 s; lazy pages touches only the CRIU read, and at level 1 the wake copies \~51 GiB of weights host → GPU right after restore, so only the \~23 GiB remainder goes lazy: ceiling \~3–4 s, risk of a slower wake.
5. Image 74 → 25 GiB (sleep level 2, chart knob and shim in place since [#15019](https://github.com/reductoai/api/pull/15019)): blocked on a vLLM whose in-place weight reload handles the NVFP4 ModelOpt MoE package — Jean's call: file upstream or wait for a newer vLLM.
6. Coverage, 9 targets (3 Dynamo models × uss1/usw3/use1), 1 live today. Jean's rule (11-17): every step ships to all three regions together, never region by region, so the infra comes first. Not targets: usw1 (AWS, Triton only), extract (moved to Modal).<br />a. Done 11-18 11:55 AM PT (Logs): Snapshot live on usw3 + use1; the shared config lives once in <code>clusters/gpu-inference/snapshot/</code> and the common values (Jean's review). Was: shared infra on usw3 + use1 — Terragrunt (Filestore CSI, <code>snapshot</code> namespace, <code>filestore-zonal-rwx</code> class, a 1 TiB Zonal share each): usw3 has all three live since #14405 (CSI driver, namespace, <code>filestore-zonal-rwx</code> class; drift plans clean); use1 gets them in [#15256](https://github.com/reductoai/api/pull/15256) (gke CSI addon toggle + dynamo-pilot namespace and class, NFS export to the use1 node subnet 10.240.0.0/20) — Jean applies the two Scalr stacks; then [#15257](https://github.com/reductoai/api/pull/15257) adds the Snapshot HelmRelease (uss1's rendered object, byte for byte: images, GKE patches, node cache, 1 TiB share), the dynamo-operator <code>checkpoint.enabled</code> flag and the pruner to <code>prod-gpu-usw3</code> and <code>prod-gpu-use1</code>, promoted all-regions after #15256 is applied.<br />b. fpp-35b on all three regions — one values PR (checkpoint, warmup, 2 s probe, canary wait as on uss1); each region's capture needs a free B200 for \~20 min.<br />c. fpp-2b live on all three — pilot proof done 11-18 02:45Z (Logs): [#15225](https://github.com/reductoai/api/pull/15225) made the uss1 pilot the tiered graph (<code>fpp-2b-snapshot-tiered-dynamo</code>: floor worker at priority 0 + burst 0..1, both checkpointed; chart flag <code>autoscaling.pinMaxReplicas</code>). The Dynamo operator captured one checkpoint per component (floor: dump 12.8 s, commit 4.7 min; burst: commit 7.2 min), the floor restored on a roll in 12 s (first start 3 min 30 s = the 23.8 GB node-cache fill), the burst restored on a forced 0 → 1 in 13 s. Pilot paused by [#15248](https://github.com/reductoai/api/pull/15248). Left: one values PR for live fpp-2b in the three regions (after a); each region's two captures need a free B200 for \~15 min each.<br />d. maverick on all three — blockers: no pilot; the warmup shim sends R-1 page requests only (maverick needs its own warmup input); weights load through ModelExpress (never captured); a maverick-snapshot copy on uss1 first (needs a GPU on the pilot node), then one values PR.<br />Shared: alerting (step 7) and the pruner on (step 2) should land before coverage widens; each capture costs a free GPU and 10–20 min per component per template change.
7. Alert on a failed capture or a restore that fell back to cold start: [#15200](https://github.com/reductoai/api/pull/15200) (gate clean 11-17 3:50 PM PT; Jean merges, then applies the <code>reducto-datadog-monitors</code> Scalr plan). One event monitor on the Snapshot agent's kube events across <code>prod-gpu-*</code>: <code>CheckpointFailed</code> (capture failed, the template cold starts) and <code>RestoreWorkerFailed</code> (restore failed, the worker cold started), to infra-alerts + Jean. Not covered: slow-but-successful restores; operator-only failures. Note (Xander, 11-17): the Modal flash GPU-snapshot servers (r1, r1mini, magpie, agentic) emit no <code>modal.input_events.coldstart_time_us</code>, so [#15154](https://github.com/reductoai/api/pull/15154)'s cold-start monitors cannot cover them; those need another signal.

Plan page with the restore numbers: <a href="https://app.notion.com/p/4174a78a1c878110b429c03cf77d1007">Restore toward 10 s: plan (fpp-35b on uss1)</a>.

</details>

<details>
<summary>Logs</summary>



</details>

<details>
<summary>\[2026-11-18 11:55 PT\] Step 6a done: Snapshot live on usw3 and use1. #15256 merged and both Scalr stacks applied by Jean (use1 Filestore CSI, snapshot namespace, filestore-zonal-rwx class, 11:39 AM PT). #15257 reworked on Jean's review ("shouldn't it be defined in values.yaml?"): the Snapshot HelmRepository + HelmRelease live once in clusters/gpu-inference/snapshot/ (included by the uss1/usw3/use1 kustomizations; usw1 not), the operator checkpoint.enabled and the pruner (deletes on) are the dynamo-platform/values/common.yaml and inference-models/values.yaml defaults with usw1 opting out; rendered objects unchanged on all four clusters. Merged and promoted (run 44380493636, pins 3117ac93). Verified on both clusters: release Ready, agents 4/4 with the node cache, operator 1/1, PVC Bound 1 TiB (Filestore provisioned in ~5 min), dynamo-operator restarted, pruner ran at 11:45 AM PT with nothing to prune; no worker rolled, uss1 unchanged. Follow-up from Codex: #15314 makes the Flux rollout probe the snapshot release and namespace on GKE clusters so a stuck install fails a promote instead of timing out as a slow roll.</summary>



</details>

<details>
<summary>\[2026-11-17 21:20 PT\] fpp-2b tiered pilot paused: #15248 merged and promoted to all four clusters (run 44241784092, pins 0d33344b). uss1 has the three live DGDs only, no pilot pods; pkxh 6/8 GPUs (pilot B200 back in the pool); maverick's weekday-peak cron back at 7; protectedFloor 23. Both uss1 pilots now paused; the pruner removes the pilot checkpoints on its next pass.</summary>



</details>

<details>
<summary>\[2026-11-17 23:30 PT\] fpp-2b tiered pilot proof (step 6c) done on uss1. #15225 merged (also pauses fpp-35b-snapshot, protectedFloor 24) and promoted to all four clusters (run 44221367620, target 440ab68b; infra_applied after the Scalr applies of the us-west-2 eks-addons and the datadog-monitors change in the range). Helm replaced the two pilot DGDs with fpp-2b-snapshot-tiered-dynamo; the Dynamo operator created one SnapshotJob per worker component and status.checkpoints got both keys. pkxh was 8/8, so the burst pool's initial replica (a traffic-less pilot pod) was paused at 0 to hand its GPU to the floor capture: floor dump 12.8 s + PageBroker commit 283 s (Completed 02:32Z), burst commit 434 s (Completed 02:40Z). Floor first start 02:32:10 → Ready 02:35:40Z (3 min 30 s; the 23.8 GB node-cache fill took 3 min 33 s). Floor roll: pod deleted 02:40:37Z, replacement start 02:41:45 → Ready 02:41:57Z (12 s; agent nsrestore 7 s). Burst forced 0 → 1 (floor set to 0 for 3 min via the DGD, burst held at 1 via its ScaledObject): start 02:44:36 → Ready 02:44:49Z (13 s). Floor back: 13 s. Every start was a CRIU restore from the component's own checkpoint; both overrides reverted. Pause PR #15248 (enabled false, protectedFloor 23, deploy guard 3/3, maverick weekday peak back to 7).</summary>



</details>

<details>
<summary>\[2026-11-17 20:00 PT\] Jean keeps the share at 1 TiB (captures stay ~19 min). PageBroker back to upstream: #15222 merged and promoted (run 44214221859; uss1 agents on -8, PageBroker v0.2.0). Step 6c pilot PR #15225 open: fpp-2b-snapshot becomes the tiered graph (fpp-2b-snapshot-tiered-dynamo, floor worker at priority 0 + burst 0..1, both checkpointed; chart flag autoscaling.pinMaxReplicas); the floor worker holds 1 B200 on pkxh for the proof (Xavier, SuperJean OK).</summary>



</details>

<details>
<summary>\[2026-11-17 18:05 PT\] Pruner on: #15210 merged and promoted (run 44210945751, all clusters); first real run 5:00 PM PT deleted exactly the superseded pilot checkpoint 5d8dd849 (share 211 → 146 GiB), live ones kept. Commit cause found by scratch test: the 1 TiB Zonal share writes incompressible data at ~60 MB/s in every mode and with 2–4 writers; zeros write at 111–130 (compressed), so the earlier dd-zero number was 2× too high and #15157 gains nothing. Floor at 1 TiB ≈ 19 min per 65 GiB capture. Options sent to Xavier for Jean: Zonal 3 TiB resize, accept, or level 2; plus revert PageBroker to the upstream mirror.</summary>



</details>

<details>
<summary>\[2026-11-17 17:25 PT\] Pilot re-capture (8897baf8, #15174): dump 40 s, PageBroker commit 19.6 min — no gain from #15157's direct writes (expected ~10 min). Cause under investigation (O_DIRECT fallback on NFS or synchronous direct writes). Old pilot checkpoint 5d8dd849 now superseded: the pruner dry run should list exactly it.</summary>



</details>

<details>
<summary>\[2026-11-17 16:25 PT\] Step 7 done: #15200 merged, Scalr applied 3:55 PM PT, Datadog monitor 29836526 live. Pilot roll from #15174 started 3:55 PM PT (Xavier's qwen promote): capture source pod took the old pilot worker's GPU on pkxh, new pilot worker Pending until the capture frees it. Jean OK'd the pruner on: dryRun-off PR follows the first dry run that lists exactly the old pilot checkpoint 5d8dd849.</summary>



</details>

<details>
<summary>\[2026-11-17 15:50 PT\] Step 7 PR #15200: Datadog event monitor on Snapshot agent kube events (CheckpointFailed, RestoreWorkerFailed) for all prod-gpu-*; gate clean, sent to Xavier for Jean. Step 6 reordered by model, all regions together (Jean's rule). #15174 rides Xavier's qwen promote; pkxh 8/8 so its pilot capture may wait or fail — re-trigger when a GPU frees.</summary>



</details>

<details>
<summary>\[2026-11-17 15:10 PT\] PR #15157: PageBroker publishes the image with 64 MiB O_DIRECT writes (image v0.2.0-local-cache-9, first PageBroker built by us; agent unchanged). Expected commit 18.5 → ~10 min; proof = next pilot capture after promote. Tier options (Zonal 3 TiB recommended) sent to Jean via SuperJean.</summary>



</details>

<details>
<summary>\[2026-11-17 12:00 PT\] Measured (pkxh → Filestore, dd direct 4 GiB, scratch dir deleted): 1 writer 121 MB/s, 4 × 32.5, 8 × 16.4 — writes cap at ~130 MB/s per node; PageBroker's buffered std::filesystem::copy gets 68. Lazy pages (step 4) parked: chart flag is dump-only, ceiling 3–4 s at sleep level 1.</summary>



</details>

<details>
<summary>\[2026-11-16 09:55 PT\] Bug fix: https://app.devin.ai/review/reductoai/api/pull/14906</summary>



</details>

<details>
<summary>\[2026-11-16 12:14 PT\] Bug fix: https://app.devin.ai/review/reductoai/api/pull/14995</summary>



</details>

<details>
<summary>\[2026-11-13 15:36 PT\] Snapshot agent memory 64Gi → 256Gi live on uss1: #14887. The 1112 package holds ~64 GiB of host memory at capture (vLLM sleep backs the weights up to CPU) and CRIU writes inside the agent's cgroup; the agent OOMed mid-dump.</summary>



</details>

<details>
<summary>\[2026-11-16 10:50 PT\] PageBroker staging 64Gi → 200Gi live on uss1: #14906. CRIU stages the whole image in a RAM tmpfs before the Filestore write; the fpp-35b image is 74 GiB, so the dump died with ENOSPC.</summary>



</details>

<details>
<summary>\[2026-11-16 11:12 PT\] Pilot fpp-35b-snapshot back on, live on uss1: #14982 (off since #14904, whose cleanupOnFail: false stays, so a failed pilot capture can no longer delete R-1 mini's graph). Capture started on pkxh.</summary>



</details>

<details>
<summary>\[2026-11-16 11:45 PT\] Capture passed: cuda-checkpoint 10 s, CRIU dump 39 s, Filestore commit 18.5 min (74 GiB), 19.5 min from pause; agents 0 restarts. First clean 1112 fpp-35b capture.</summary>



</details>

<details>
<summary>\[2026-11-16 11:50 PT\] Restore failed: CRIU Can't open file root/.cache/tvm-ffi/….so; the fallback cold start crash-looped (shim RecursionError).</summary>



</details>

<details>
<summary>\[2026-11-16 12:15 PT\] Restore fixes merged: #14995. TVM_FFI_CACHE_DIR on the rootfs (the 1112 package JIT-builds two flashinfer kernels into ~/.cache/tvm-ffi, the pod's emptyDir, so the restored pod had no file for CRIU to reopen); the warmup shim finds itself by file (ConfigMap symlinks made the two shims chain each other until RecursionError).</summary>



</details>

<details>
<summary>\[2026-11-16 12:28 PT\] Paused the pilot worker (KEDA paused-replicas=0, Jean's OK) so uss1's inference-models upgrade could pass the canary of the all-cluster run; unpaused at 1:25 PM.</summary>



</details>

<details>
<summary>\[2026-11-16 12:58 PT\] #14995 live on uss1 (b583614c). Deleted the orphaned fpp-2b-snapshot capture job that the old shim had left looping its warmup (62 rounds, 1 GPU), Jean's OK.</summary>



</details>

<details>
<summary>\[2026-11-16 13:25 PT\] Capture #2 passed with the fixes: ready for snapshot 8 min after start, cuda-checkpoint 10.5 s, CRIU dump 38 s, Filestore commit 19 min (74 GiB).</summary>



</details>

<details>
<summary>\[2026-11-16 13:29 PT\] Restore proof passed: pilot worker pod-create → Ready in 3 min 46 s (CRIU restore 3 min 34 s reading 74 GiB from Filestore, first time on the node; cuda restore 6.3 s), 3 chat completions 200 (606 / 44 / 46 ms). First 1112 fpp-35b checkpoint/restore end to end. The image size is now the lever: sleep level 2 before capture (~15 GiB).</summary>



</details>

<details>
<summary>\[2026-11-16 13:57 PT\] Checkpoint back on for live fpp-35b: #15014 merged and promoted by Jean (daytime). The 16 workers roll one at a time (cold starts until the checkpoint exists); live checkpoint Ready at 2:22 PM (paused 2:02, CRIU dump 48 s, 19.5 min total).</summary>



</details>

<details>
<summary>\[2026-11-16 14:23 PT\] Sleep level 2 for the pilot merged: #15019 (worker.checkpoint.sleepLevel; the shim patches Dynamo's pause/resume: sleep(2) → wake weights → reload_weights → wake KV cache, and keeps the DFlash drafter's parameters across the sleep, which vLLM 0.31's level 2 would discard). Promote in the evening trough.</summary>



</details>

<details>
<summary>\[2026-11-16 14:56 PT\] Live fpp-35b roll done, 16/16 on the checkpoint template, no failures. 8 workers cold-started (created before the checkpoint was Ready), 8 restored from Filestore in ~3 min pod-create → Ready (CRIU ~2 min 50 s for 74 GiB), then the first restore from the node-local SSD cache: 24 s pod-create → Ready (agent 18 s, CRIU 11 s). The cache copy took ~30 min per node under the restore contention; from here fpp-35b replacements on uss1 restore in ~25 s instead of a 3-17 min cold start.</summary>



</details>

<details>
<summary>\[2026-11-16 15:23 PT\] Sleep level 2 on the pilot (#15019, live via Jean's promote to ff6a1eca): capture image 25 GiB (level 1: 74), CRIU dump 14 s (38-48 s), Filestore commit 12 min (19 min). Restore from Filestore 5 min 12 s pod-create → Ready (CRIU 4 min 30 s under Filestore contention, weights reload 26 s).</summary>



</details>

<details>
<summary>\[2026-11-16 15:55 PT\] Level 2 dropped: the restored worker answered 200 with garbage. Cause reproduced without a checkpoint (level 1 sleep + the level 2 resume): vLLM 0.31's in-place reload_weights garbles the 1112 NVFP4/Overshoot package. Pilot back to level 1 in #15031; knob and shim stay. Live fpp-35b was never on level 2.</summary>



</details>

<details>
<summary>\[2026-11-16 16:02 PT\] #15031 live on uss1 (Jean's promote to 3ba08032). The live fpp-35b re-roll under the #15019 shim finished 16/16, 0 failures; live checkpoint re-captured at level 1.</summary>



</details>

<details>
<summary>\[2026-11-16 16:32 PT\] Pilot re-captured at level 1 (CRIU dump 45 s, Filestore commit 18.5 min, 74 GiB, Ready 16:28) and restored from it: 3 min 15 s pod-create → Ready (CRIU restore 3 min from Filestore, cuda restore 8 s, 0 restarts), coherent output on 3 chat completions. Level 2's garbage is gone; everything on uss1 is at level 1.</summary>



</details>

<details>
<summary>\[2026-11-16 16:46 PT\] Deleted the 18 superseded SnapshotJobs and the 19 orphaned PodSnapshots (Jean's OK via David): Filestore 582 → 146 GiB, node caches 19 → 3 copies (169 GiB each). The 3 current checkpoints stay.</summary>



</details>

<details>
<summary>\[2026-11-16 17:27 PT\] Node-cache fill live on uss1: #15043 (agent image local-cache-8: newest checkpoint first, a restore's checkpoint jumps the queue, 4 parallel O_DIRECT streams). Measured on twp2: the 78.6 GB fpp-35b image re-copied in 3 min 30 s (~374 MB/s) vs 22-32 min (~45 MB/s) before; no buffered fallback. A fresh node holds the 3 current images in ~10 min; after a capture every node has the new image ~4 min after Ready.</summary>



</details>

<details>
<summary>\[2026-11-16 18:55 PT\] #15055 ready (gate clear): checkpoint-prune CronJob, uss1, dry run; keep-set across all DGDs, unready DGDs frozen, objects under 1 h old skipped. Merged by Jean 11-17.</summary>



</details>

<details>
<summary>\[2026-11-17 11:50 PT\] #15055 live on all four GPU clusters (my flux promote to f9b090e5, Jean now lets us dispatch). First dry run on uss1: keep = the 3 current checkpoints, frozen = fpp-2b-tiered and maverick (no checkpointing), nothing to delete (the hand cleanup emptied the backlog). First real candidate appears at the next template change; dryRun off waits for Jean's call.</summary>



</details>

<details>
<summary>Impact</summary>

- fpp-35b worker start on uss1: 3 to 17 min cold start → \~24 s restore from node SSD. Measured on uss1, reported 2026-11-18.
- fpp-35b share of calls on Modal: 21% → 2.3% fleet-wide after the 4-cluster promote (all four clusters on 8122ce7), measured fleet-wide by Mary, 2026-11-19 09:00 PT.
- Pending GPU pods after the promote: use1 0 → 3 (burst waiting for GPUs, by design), uss1 and usw3 stayed at 0. Measured 2026-11-19 (Mary).
- uss1 reuse trial: fpp-35b burst pod start 5 to 6 min cold → 1.6 to 1.7 min restore (19 min to capture). fpp-35b Modal share on uss1: 0.7 to 0.8% (20 min of data). Measured on uss1, 2026-11-19 \~11:10 PT (Mary).
- GPU cost per 1k pages and failed/fallback pages during scale-ups: not measured yet; measure before vs after once it ships.

</details>

<details>
<summary>NATS-off</summary>

<b>Goal</b><br />Turn off Dynamo's unused NATS in every region; every new worker needs NATS to start.

<b>Plan</b>

- Mary rolls step 1 to all four clusters.
- Step 2: remove NATS once no pod has NATS\_SERVER.

<b>Logs</b>

- Nov 19: plan stamped.
- Nov 19: [#15415](https://github.com/reductoai/api/pull/15415) ✅, rolled back on uss1 (an old fpp-35b burst worker crashlooped without NATS); usw1 passed.
- Nov 19: step 1 [#15453](https://github.com/reductoai/api/pull/15453) ✅ (stop injecting NATS\_SERVER).

<b>Impact</b>

- Not measured yet: worker start time and failed starts.

</details>

