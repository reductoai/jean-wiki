# Plan: Training queue on the GPU clusters

<figure class="diagram">
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 250" role="img" aria-label="Training queue flow: sbatch to federated Slurm controllers, jobs on idle B200s, evicted by inference and requeued from the newest checkpoint" font-family="Geist, ui-sans-serif, system-ui, sans-serif" font-size="13">
    <defs><marker id="tqArrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="#5b6b8c"/></marker></defs>
  <g>
    <rect x="10" y="40" width="150" height="70" rx="8" fill="#eceef3" stroke="#5b6b8c"/>
    <text x="85" y="68" text-anchor="middle" font-weight="600">sbatch</text>
    <text x="85" y="88" text-anchor="middle" font-size="12">on a login pod</text>
    <rect x="195" y="40" width="170" height="70" rx="8" fill="#eceef3" stroke="#5b6b8c"/>
    <text x="280" y="64" text-anchor="middle" font-weight="600">Slurm controllers</text>
    <text x="280" y="84" text-anchor="middle" font-size="12">one per cluster, federated</text>
    <text x="280" y="100" text-anchor="middle" font-size="12">use1, uss1, usw3</text>
    <rect x="400" y="40" width="200" height="70" rx="8" fill="#e6efea" stroke="#34845f"/>
    <text x="500" y="64" text-anchor="middle" font-weight="600">First cluster with free B200s</text>
    <text x="500" y="84" text-anchor="middle" font-size="12">job runs in slurmd pods</text>
    <text x="500" y="100" text-anchor="middle" font-size="12">1 GPU each, 0 to 4 a cluster</text>
    <rect x="635" y="40" width="255" height="70" rx="8" fill="#f6ebe8" stroke="#b5543c"/>
    <text x="762" y="64" text-anchor="middle" font-weight="600">Inference worker Pending</text>
    <text x="762" y="84" text-anchor="middle" font-size="12">evicts a slurmd pod (30 s grace)</text>
    <text x="762" y="100" text-anchor="middle" font-size="12">training priority -2000, never preempts</text>
  </g>
  <line x1="160" y1="75" x2="193" y2="75" stroke="#5b6b8c" stroke-width="1.5" marker-end="url(#tqArrow)"/>
  <line x1="365" y1="75" x2="398" y2="75" stroke="#5b6b8c" stroke-width="1.5" marker-end="url(#tqArrow)"/>
  <line x1="600" y1="75" x2="633" y2="75" stroke="#5b6b8c" stroke-width="1.5" marker-end="url(#tqArrow)"/>
  <rect x="400" y="160" width="490" height="60" rx="8" fill="#f6efdf" stroke="#dba943"/>
  <text x="645" y="184" text-anchor="middle" font-weight="600">Slurm requeues the whole job</text>
  <text x="645" y="204" text-anchor="middle" font-size="12">it resumes from its newest checkpoint on the shared /home (Filestore)</text>
  <line x1="762" y1="110" x2="762" y2="158" stroke="#5b6b8c" stroke-width="1.5" marker-end="url(#tqArrow)"/>
  <path d="M400,190 L280,190 L280,112" fill="none" stroke="#5b6b8c" stroke-width="1.5" marker-end="url(#tqArrow)"/>
  <text x="290" y="150" font-size="12" fill="#5b6b8c">offered to all three again</text>
  <text x="10" y="24" font-size="12" fill="#5b6b8c">Floors hold 28 of 32 B200s per cluster, so training gets at most 4 GPUs a cluster, 12 in all.</text>
  <text x="10" y="240" font-size="11" fill="#5b6b8c">/scratch on node local SSD holds staged data only and is wiped on eviction.</text>
</svg>
</figure>

**Inference floors hold 28 of 32 B200s on every cluster, so only 1 to 4 GPU jobs fit today.** That leaves 4 GPUs a cluster, 12 in all, and not always on one node. Our training presets ask for a whole node (8 GPUs for 10 days), so none fit as written.

**Ask: Jean's stamp on a Slurm queue that lends those idle B200s to training on use1, uss1 and usw3, with inference always first. Nothing is built.** The upper bound is 12 idle B200s at $5.5 an hour, $66 an hour we already pay; real idle hours are not measured yet (step 1).

## Decisions

- **Slurm by Flux:** Slinky `slurm-operator` and `slurm` charts at one pinned release, wrapped like `helm-charts/dynamo-platform`, one HelmRelease per cluster. Controller, accounting and login pods run on the system pool.
- **Inference first:** a new PriorityClass `gpu-training` (value -2000, `preemptionPolicy: Never`). Every inference worker outranks it, so kube-scheduler evicts a `slurmd` pod as soon as a floor or burst worker is Pending. Training preempts nothing.
- **GPUs only while a job needs them:** `slurmd` pods take 1 GPU each, 0 to 4 per cluster, scaled by KEDA (already on the clusters) from pending plus running Slurm jobs. No job, no pod.
- **Eviction requeues the job:** jobs run with `--requeue`. An evicted pod takes its Slurm node down, Slurm requeues the whole job, and it resumes from its newest periodic checkpoint, losing the work since. The 30 s eviction window is too short for a large checkpoint, so nothing relies on a save at SIGTERM.
- **Storage like the researchers' Slurm box:** one Filestore share is `/home` in the login pod and every `slurmd` pod on all three clusters, holding repos, venvs, datasets and checkpoints at one path. A requeued job finds its checkpoint on any cluster. Node local SSD is `/scratch`, for staged hot data only, wiped on eviction. Finished runs still export to S3 as today.
- **One queue, any free cluster:** Slurm federation, one controller per cluster and one shared accounting database. `sbatch` offers the job to all three and the first with free GPUs runs it. A job stays in one cluster, because the RDMA network is per zone.

## Open choices (each default stands unless Jean picks otherwise)

1. **Who gets idle GPUs:** the night steps of the [hybrid server plan](https://app.notion.com/p/3f34a78a1c8781598959f1534a4ba38e) (waiting on stamp) fill the same idle B200s with prod apps. Default: night inference outranks training, which takes what is left.
2. **Job size:** default 1 to 4 GPU jobs (drafts, evals, small SFT). The other option lowers floors off-peak so whole nodes free up at night for 8 GPU jobs, and more inference goes to Modal.
3. **Pilot cluster:** default uss1.
4. **/home size and tier:** default Filestore zonal, 10 TiB, in uss1, price to confirm before the PR. It is NFS, so the far clusters see cross-region latency, which is why hot data stages to `/scratch`. Other options: a GCS bucket over GCS FUSE (cheaper, but not a real filesystem, so no venvs or repos) and Managed Lustre (fastest, priciest, one zone).
5. **Slurm or Kueue:** default Slurm (Slinky), because the presets are already `sbatch`. Kueue with MultiKueue gives the same any-free-cluster queue with less to run, but every preset becomes a Kubernetes Job. Kueue is the fallback if a pilot check fails.

## Guards

- **Inference waits at most 30 s longer:** an evicted `slurmd` pod gets a 30 s grace period. A monitor fires when an inference pod is Pending over 60 s while a `slurmd` pod holds a GPU.
- **Kill switch:** KEDA max replicas 0 on the NodeSet frees every training GPU in one values change.
- **Rollouts:** surge pods outrank training, so a Flux roll evicts training instead of stalling.

## Steps

1. **Measure, read only:** free GPU hours per cluster and per node over the last 14 days. Stop if the median is under 2 free GPUs.
2. **PR 1, uss1 only (the GCP canary):** charts, HelmRelease, PriorityClass, control plane, and a login pod with `/home` on a new Filestore share, NodeSet at 0. It touches no GPU.
3. **PR 2, uss1:** NodeSet plus KEDA scaling. Test: run a 4 GPU job, force an inference scale-up, and confirm the worker gets its GPU within 60 s and the job requeues and resumes.
4. **PR 3, training side (Raymond):** a 1 to 4 GPU `sbatch` preset with `--requeue`, periodic checkpoints under `/home`, and resume on start. The 35B preset saves every 106 steps with `--no_save_optim true --no_save_rng true`, so a resume restarts the optimizer; resumable presets must save both.
5. **PR 4, all three clusters at once:** install on use1 and usw3, the shared accounting database, federation, and `/home` mounted everywhere. Jean applies the Terraform it needs: controller access between clusters, and the Filestore share exported to all three node subnets.
6. **Impact:** training GPU hours served from idle B200s against RunPod and Modal spend, with inference p99 and Modal spill unchanged.

Each PR is about one session; the Terraform apply and the pilot test are the waits.

<details>
<summary>Reference: what the repo says today, and what is not verified</summary>

**Today**

- Three GKE clusters (use1, uss1, usw3), each with one fixed `b200` pool of 4 nodes x 8 GPUs = 32 B200s, reserved, no autoscaling (`terragrunt/modules/gcp-gke/main.tf`).
- Floors: `protectedFloor: 28` on every cluster. KEDA fills the other 4 at peak as burst headroom.
- Presets: `--gres=gpu:8` for 10 days (`reducto-training/nice_trainer/presets/*/slurm-submit.sbatch`).
- Priorities: Dynamo floor workers 1000 (preempt), burst workers 0.
- The three clusters share one VPC (`prod-gpu-primary`). uss1 already has a Filestore class for Snapshot checkpoints.
- Each B200 node has 32 local SSDs, shared with the inference model caches.
- Researchers keep repo, venv, data and outputs under a shared `/home/<user>` and stage hot data to local SSD (`slurm-launch.sh`).

**Not verified (the pilot proves or kills each)**

1. Live free GPUs: the 4 per cluster is from config, not a measurement.
2. That `slurmd` pods see GPUs on GKE COS nodes with the GKE-managed driver.
3. That a requeued federated job is offered to all clusters again, not only the one it ran on.
4. That controllers and the accounting database reach each other across the three clusters' subnets.
5. That multi-pod jobs (4 x 1 GPU pods) train at acceptable speed over the pod network.
6. Checkpoint write speed across regions, with one Filestore share mounted from use1 and usw3.
7. Free local SSD space on B200 nodes next to the inference model caches.

</details>
