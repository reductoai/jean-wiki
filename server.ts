import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { render } from "./lib/render.ts";
import { CHAPTERS, PAGES, TODO, type Page } from "./lib/site.ts";
import { layout, editor, denied } from "./lib/views.ts";

const ROOT = import.meta.dir;
const DATA = process.env.HOSTING_DATA_DIR ?? join(ROOT, ".data");
const OWNERS: string[] = JSON.parse(readFileSync(join(ROOT, "content/access.json"), "utf8")).owners.map((e: string) => e.toLowerCase());

export type Share = { mode: "private" | "reducto" | "people"; emails: string[] };

const sharesFile = join(DATA, "shares.json");
const readShares = (): Record<string, Share> => (existsSync(sharesFile) ? JSON.parse(readFileSync(sharesFile, "utf8")) : {});
const shareOf = (slug: string): Share => readShares()[slug] ?? { mode: "private", emails: [] };

const repoFile = (slug: string) => join(ROOT, "content", `${slug}.md`);
const editedFile = (slug: string) => join(DATA, "pages", `${slug}.md`);
const historyDir = (slug: string) => join(DATA, "history", slug);

function source(slug: string): { markdown: string; edited: boolean } {
  const f = editedFile(slug);
  if (existsSync(f)) return { markdown: readFileSync(f, "utf8"), edited: true };
  return { markdown: readFileSync(repoFile(slug), "utf8"), edited: false };
}

function history(slug: string) {
  const dir = historyDir(slug);
  if (!existsSync(dir)) return [];
  return readdirSync(dir).filter((f) => f.endsWith(".json")).sort().reverse().slice(0, 30)
    .map((f) => JSON.parse(readFileSync(join(dir, f), "utf8")) as { at: string; by: string; file: string });
}

function save(slug: string, markdown: string, by: string) {
  const at = new Date().toISOString();
  const stamp = at.replace(/[:.]/g, "-");
  mkdirSync(join(DATA, "pages", slug, ".."), { recursive: true });
  mkdirSync(historyDir(slug), { recursive: true });
  writeFileSync(editedFile(slug), markdown);
  writeFileSync(join(historyDir(slug), `${stamp}.md`), markdown);
  writeFileSync(join(historyDir(slug), `${stamp}.json`), JSON.stringify({ at, by, file: `${stamp}.md` }));
}

const email = (req: Request) => (req.headers.get("x-reducto-user-email") ?? process.env.WIKI_DEV_EMAIL ?? "").toLowerCase();
const isOwner = (who: string) => OWNERS.includes(who);
const canRead = (who: string, slug: string) => {
  if (isOwner(who)) return true;
  const s = shareOf(slug);
  return (s.mode === "reducto" && who !== "") || (s.mode === "people" && s.emails.includes(who));
};

function basePath(pathname: string): string {
  if (process.env.HOSTING_BASE_PATH) return process.env.HOSTING_BASE_PATH.replace(/\/?$/, "/");
  const m = pathname.match(/^\/(?:internal|external)\/jean-wiki\//);
  return m ? m[0] : "/";
}

const html = (body: string, status = 200) => new Response(body, { status, headers: { "content-type": "text/html; charset=utf-8" } });
const json = (body: unknown, status = 200) => Response.json(body, { status });

const server = Bun.serve({
  port: Number(process.env.PORT ?? 3000),
  async fetch(req) {
    const url = new URL(req.url);
    const base = basePath(url.pathname);
    const path = url.pathname.startsWith(base) ? url.pathname.slice(base.length) : url.pathname.replace(/^\//, "");
    const who = email(req);

    if (path.startsWith("static/")) {
      const file = Bun.file(join(ROOT, "public", path.slice("static/".length).replace(/\.\./g, "")));
      return (await file.exists()) ? new Response(file) : new Response("Not found", { status: 404 });
    }

    if (path.startsWith("api/")) {
      const slug = url.searchParams.get("page") ?? "";
      const page = PAGES.find((p) => p.slug === slug);
      if (!page) return json({ error: "unknown page" }, 404);
      if (!isOwner(who)) return json({ error: "only the wiki owner can do this" }, 403);
      if (req.method === "POST" && path === "api/preview") {
        const { markdown } = await req.json();
        return json({ html: render(markdown, base).html });
      }
      if (req.method === "POST" && path === "api/save") {
        const { markdown } = await req.json();
        if (typeof markdown !== "string") return json({ error: "markdown required" }, 400);
        save(slug, markdown, who);
        return json({ ok: true });
      }
      if (req.method === "GET" && path === "api/version") {
        const file = url.searchParams.get("file") ?? "";
        const f = file === "repo" ? repoFile(slug) : join(historyDir(slug), file.replace(/[^\w.-]/g, ""));
        return existsSync(f) ? json({ markdown: readFileSync(f, "utf8") }) : json({ error: "not found" }, 404);
      }
      if (req.method === "POST" && path === "api/share") {
        const body = (await req.json()) as Share;
        const shares = readShares();
        shares[slug] = { mode: body.mode, emails: (body.emails ?? []).map((e) => e.trim().toLowerCase()).filter(Boolean) };
        mkdirSync(DATA, { recursive: true });
        writeFileSync(sharesFile, JSON.stringify(shares, null, 2));
        return json({ ok: true, share: shares[slug] });
      }
      return json({ error: "not found" }, 404);
    }

    const page = PAGES.find((p) => p.path === path || p.path === `${path}/`);
    if (!page) return html(layout({ base, page: TODO, nav: navFor(who), body: "<h1>Not found</h1>", headings: [], owner: false }), 404);
    if (!canRead(who, page.slug)) return html(denied(base, who), 403);

    const { markdown, edited } = source(page.slug);
    if (url.searchParams.has("edit") && isOwner(who)) {
      return html(editor({ base, page, markdown, edited, history: history(page.slug), share: shareOf(page.slug) }));
    }
    const { html: body, headings } = render(markdown, base);
    return html(layout({ base, page, nav: navFor(who), body, headings, owner: isOwner(who), share: shareOf(page.slug) }));
  },
});

function navFor(who: string) {
  const visible = (p: Page) => canRead(who, p.slug);
  return { todo: visible(TODO) ? TODO : null, chapters: CHAPTERS.map((c) => ({ ...c, pages: c.pages.filter(visible) })).filter((c) => c.pages.length) };
}

console.log(`jean-wiki on :${server.port}`);
