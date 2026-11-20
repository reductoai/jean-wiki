export type Source = { title: string; url: string; kind?: "code" };
export type Page = { slug: string; path: string; title: string; sources?: Source[] };

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
];

export const PAGES: Page[] = [TODO, ...CHAPTERS.flatMap((c) => c.pages)];

/** Notion page id to the wiki path that shows it, so Notion links stay inside the wiki. */
export const LINKS: Record<string, string> = {
  "41c4a78a1c8781b189d1ff1ff6626677": "",
  "4164a78a1c87818ea15bdef76227228c": "inference-router/more-apps",
  "4164a78a1c87810ca8c1d9697c4f5971": "inference-router/eu-r1",
};
