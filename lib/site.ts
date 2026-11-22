export type Source = { title: string; url: string; kind?: "code" };
/** `parent` nests a page under another page or subsection; `sub` marks a subsection heading, which has no content of its own. */
export type Page = { slug: string; path: string; title: string; sources?: Source[]; parent?: string; sub?: boolean; planOf?: string };

const n = (title: string, id: string): Source => ({ title, url: `https://app.notion.com/p/${id}` });
const gh = (path: string, title = path): Source => ({ title, url: `https://github.com/reductoai/api/${path.includes(".") ? "blob" : "tree"}/main/${path}`, kind: "code" });
export type Chapter = { number: number; title: string; pages: Page[] };

export const TODO: Page = { slug: "todo", path: "", title: "Todo", sources: [n("Workstreams", "41c4a78a1c8781b189d1ff1ff6626677")] };

export const CHAPTERS: Chapter[] = [
  {
    number: 1,
    title: "Inference router",
    pages: [
      { slug: "inference-router/intro", path: "inference-router/", title: "Intro and status",
        sources: [n("Inference Router", "3e34a78a1c878176a823cf87067a1956"), n("Inference Router Products", "3f34a78a1c878145944edf7e486f66d1"), n("Inference router deep dive", "3f44a78a1c878098a8acc9da939d597f"), n("EU R-1 through the inference router", "4164a78a1c87810ca8c1d9697c4f5971"), n("Workstreams", "41c4a78a1c8781b189d1ff1ff6626677"),
          gh("inference-router/cmd/router/main.go"), gh("inference-router/internal/admission/admission.go"), gh("inference-router/internal/api/handler.go"),
          gh("src/lib/inference_router/client.py"), gh("src/lms/inference_router/gate.py"), gh("src/lib/router_capacity/controller.py"),
          gh("src/services/router_controller"), gh("helm-charts/inference-router/values.yaml")] },
      { slug: "inference-router/workstreams", path: "inference-router/workstreams", title: "Workstreams and impact",
        sources: [n("More apps on the inference router (Modal floors to 1)", "4164a78a1c87818ea15bdef76227228c"), n("EU R-1 through the inference router", "4164a78a1c87810ca8c1d9697c4f5971"),
          gh("src/lms/inference_router/router.prod.yaml"), gh("src/lms/inference_router/router.prod_eu.yaml"), gh("src/lms/inference_router/router.prod_au.yaml"),
          gh("src/services/router_controller/config.prod.yaml"), gh("helm-charts/inference-router/values/eu-prod.yaml"), gh("helm-charts/inference-router/values/au-prod.yaml"),
          gh("terragrunt/modules/datadog-monitors/definitions", "terragrunt/modules/datadog-monitors/definitions (inference_router_* monitors)")] },
      { slug: "inference-router/more-apps", path: "inference-router/more-apps", title: "More apps on the router",
        sources: [n("More apps on the inference router (Modal floors to 1)", "4164a78a1c87818ea15bdef76227228c"), gh("src/lms/inference_router/router.prod.yaml"), gh("src/services/router_controller/config.prod.yaml")] },
      { slug: "inference-router/eu-r1", path: "inference-router/eu-r1", title: "EU R-1 through the router",
        sources: [n("EU R-1 through the inference router", "4164a78a1c87810ca8c1d9697c4f5971"), gh("src/lms/inference_router/router.prod_eu.yaml"), gh("helm-charts/inference-router/values/eu-prod.yaml")] },
    ],
  },
  {
    number: 2,
    title: "Workstreams",
    pages: [
      { slug: "workstreams/routed-r1-mini-to-prod", path: "workstreams/routed-r1-mini-to-prod", title: "Routed R-1 mini to prod", sources: [n("Routed R-1 mini to prod", "41a4a78a1c8780be9c83d3f02a810d07")] },
      { slug: "workstreams/snapshotting-on-the-cluster", path: "workstreams/snapshotting-on-the-cluster", title: "Snapshotting on the cluster", sources: [n("Snapshotting on the cluster", "41a4a78a1c8780f09346e07d418df2ee")] },
      { slug: "workstreams/inference-footguns", path: "workstreams/inference-footguns", title: "Inference footguns", sources: [n("Inference footguns", "41b4a78a1c8781e88b9eedaaf8354377")] },
      { slug: "workstreams/inference-observability", path: "workstreams/inference-observability", title: "Inference observability", sources: [n("Inference observability", "4164a78a1c87815ab05ec4210066571d")] },
      { slug: "workstreams/global-is-fair-game", path: "workstreams/global-is-fair-game", title: "Global is fair game", sources: [n("Global is fair game", "41c4a78a1c8780a9bb45d6c87e15a019")] },
      { slug: "workstreams/b200-gpu-sharing", path: "workstreams/b200-gpu-sharing", title: "B200 GPU sharing", sources: [n("B200 GPU sharing", "41c4a78a1c878179a3f4d03746e1ad63")] },
      { slug: "workstreams/router-r1-mini-rl-299", path: "workstreams/router-r1-mini-rl-299", title: "Router for R-1 mini RL 299", sources: [n("Router for R-1 mini RL 299", "41c4a78a1c87813d981ff3cab9633dcf")] },
      { slug: "workstreams/us-west-3-cluster", path: "workstreams/us-west-3-cluster", title: "us-west-3 cluster", sources: [n("us-west-3 cluster", "4144a78a1c87803f928cff480072bd48")] },
      { slug: "workstreams/lower-priority-calls", path: "workstreams/lower-priority-calls", title: "Lower priority calls to the cluster", sources: [n("Lower priority calls to the cluster", "41b4a78a1c878080b5c2c23c0a1e7661")] },
      { slug: "workstreams/r1-mini-optimization", path: "workstreams/r1-mini-optimization", title: "R-1 mini optimization and productionizing", sources: [n("R-1 mini optimization and productionizing", "41c4a78a1c878105af45c7991e8054c3")] },
      { slug: "workstreams/overshoot-1112-r1-35b", path: "workstreams/overshoot-1112-r1-35b", title: "Overshoot 1112 R-1 35B package", sources: [n("Overshoot 1112 R-1 35B package", "4164a78a1c878172b7cfcb952321422f")] },
      { slug: "workstreams/exa-eval", path: "workstreams/exa-eval", title: "Exa eval", sources: [n("Exa eval", "41c4a78a1c8781009a33ece713086e73")] },
      { slug: "workstreams/gpu-cluster-observability", path: "workstreams/gpu-cluster-observability", title: "GPU cluster observability and utilization", sources: [n("GPU cluster observability and utilization", "41b4a78a1c87810f8533dda3777fba9f")] },
      { slug: "workstreams/training-queue", path: "workstreams/training-queue", title: "Training queue on the GPU clusters", sources: [n("Training queue on the GPU clusters", "4204a78a1c878142be3bede694682ebc"), n("Plan: training queue on the GPU clusters", "4204a78a1c87811ca592f6d384bcaefc")] },
      { slug: "workstreams/inference-docs-cleanup", path: "workstreams/inference-docs-cleanup", title: "Inference docs and memory cleanup", sources: [n("Inference docs and memory cleanup", "41b4a78a1c87810ba012d0525c1fa9e3")] },
    ],
  },
];

export const PAGES: Page[] = [TODO, ...CHAPTERS.flatMap((c) => c.pages)];

/** Notion page id to the wiki path that shows it, so Notion links stay inside the wiki. */
export const LINKS: Record<string, string> = {
  "41c4a78a1c8781b189d1ff1ff6626677": "",
  "4164a78a1c87818ea15bdef76227228c": "inference-router/more-apps",
  "4204a78a1c878142be3bede694682ebc": "workstreams/training-queue",
  "4204a78a1c87811ca592f6d384bcaefc": "workstreams/training-queue/plan",
  "4164a78a1c87810ca8c1d9697c4f5971": "inference-router/eu-r1",
};
