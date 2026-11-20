import { Marked } from "marked";
import { loadNotion, notionToMarkdown, section, shiftHeadings } from "./notion.ts";
import { LINKS } from "./site.ts";
import { dashboardHtml, planHtml } from "./notiondb.ts";

export type Heading = { depth: number; text: string; id: string };

export const slugify = (s: string) =>
  s.toLowerCase().replace(/<[^>]+>/g, "").replace(/&[a-z]+;/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

const pt = (iso: string) =>
  new Date(iso).toLocaleString("en-US", { timeZone: "America/Los_Angeles", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) + " PT";

/** Expands `{{notion:slug}}`, `{{notion:slug#Heading}}` (optional ` shift=N`) and `{{diagram:name}}`. */
export function expand(md: string, base: string, self = ""): string {
  return md.replace(/\{\{dashboard:([\w-]+)\}\}/g, (_, ws) => dashboardHtml(ws, self ? `${base}${self}/plan` : ""))
    .replace(/\{\{plan:([\w-]+)\}\}/g, (_, ws) => planHtml(ws, self ? `${base}${self.replace(/\/plan$/, "")}` : "")).replace(/\{\{(notion|diagram):([^}#\s]+)(?:#([^}]*?))?(?:\s+shift=(\d))?\}\}/g, (_, kind, slug, heading, shift) => {
    if (kind === "diagram") return `<div class="diagram" data-diagram="${slug}"></div>`;
    const page = loadNotion(slug);
    if (!page) return `_Notion snapshot "${slug}" is missing._`;
    let body = notionToMarkdown(page.body);
    if (heading) body = section(body, heading.trim());
    body = shiftHeadings(body, Number(shift ?? 0)).replace(
      /https:\/\/app\.notion\.com\/p\/(?:[a-z0-9-]*-)?([0-9a-f]{32})/g,
      (url, id) => (LINKS[id] ? base + LINKS[id] : url),
    );
    const source = `<p class="source">From Notion: <a href="${page.url}">${page.title}</a>, edited ${pt(page.lastEdited)}. <a href="${page.url}">Edit in Notion</a></p>`;
    return `<div class="notion">\n\n${source}\n\n${body}\n\n</div>`;
  });
}

export function render(md: string, base: string, self = ""): { html: string; headings: Heading[] } {
  const headings: Heading[] = [];
  const seen = new Map<string, number>();
  const marked = new Marked({ gfm: true });
  marked.use({
    renderer: {
      heading({ tokens, depth }) {
        const inner = this.parser.parseInline(tokens);
        let id = slugify(inner) || "section";
        const n = seen.get(id) ?? 0;
        seen.set(id, n + 1);
        if (n) id = `${id}-${n}`;
        if (depth >= 2 && depth <= 3) headings.push({ depth, text: inner.replace(/<[^>]+>/g, ""), id });
        return `<h${depth} id="${id}"><a class="anchor" href="#${id}">${inner}</a></h${depth}>\n`;
      },
    },
  });
  const html = marked.parse(expand(md, base, self), { async: false }) as string;
  return { html, headings };
}
