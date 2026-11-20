export type Page = { slug: string; path: string; title: string };
export type Chapter = { number: number; title: string; pages: Page[] };

export const TODO: Page = { slug: "todo", path: "", title: "Todo" };

export const CHAPTERS: Chapter[] = [
  {
    number: 1,
    title: "Inference router",
    pages: [
      { slug: "inference-router/intro", path: "inference-router/", title: "Intro and status" },
      { slug: "inference-router/workstreams", path: "inference-router/workstreams", title: "Workstreams and impact" },
    ],
  },
];

export const PAGES: Page[] = [TODO, ...CHAPTERS.flatMap((c) => c.pages)];

/** Notion page id to the wiki path that shows it, so Notion links stay inside the wiki. */
export const LINKS: Record<string, string> = {
  "41c4a78a1c8781b189d1ff1ff6626677": "",
  "4164a78a1c87818ea15bdef76227228c": "inference-router/workstreams#more-apps-on-the-inference-router",
  "4164a78a1c87810ca8c1d9697c4f5971": "inference-router/workstreams#eu-r-1-through-the-inference-router",
};
