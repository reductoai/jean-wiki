import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

export type NotionPage = { slug: string; title: string; url: string; id: string; lastEdited: string; body: string };

const ROOT = join(import.meta.dir, "..");

export function loadNotion(slug: string): NotionPage | null {
  const file = join(ROOT, "notion", `${slug}.md`);
  if (!existsSync(file)) return null;
  const raw = readFileSync(file, "utf8");
  const m = raw.match(/^---\n(.*?)\n---\n([\s\S]*)$/);
  if (!m) return null;
  return { slug, ...JSON.parse(m[1]), body: m[2] };
}

/** Turns Notion-flavored Markdown (from the Notion MCP fetch) into plain Markdown with HTML. */
export function notionToMarkdown(md: string): string {
  return md
    .replace(/<table-of-contents\s*\/>/g, "")
    .replace(/<image[^>]*\/>/g, "")
    .replace(/<mention url="([^"]+)">([\s\S]*?)<\/mention>/g, '<a href="$1">$2</a>')
    .replace(/<mention url="([^"]+)"\s*\/>/g, '<a href="$1">$1</a>')
    .replace(/<date start="([^"]+)"(?: start-time="([^"]+)")?[^>]*\/>/g, (_, d, t) => (t ? `${d} ${t} PT` : d))
    .replace(/<page url="([^"]+)">\s*([\s\S]*?)\s*<\/page>/g, "- [$2]($1)")
    .replace(/<toggle(?: heading="h\d")?>\n(.*)\n/g, (_, s) => `<details>\n<summary>${s.replace(/^#+\s*/, "")}</summary>\n\n`)
    .replace(/<\/toggle>/g, "\n</details>\n")
    .replace(/<callout[^>]*>/g, '<div class="callout">\n\n')
    .replace(/<\/callout>/g, "\n</div>\n")
    .replace(/<\/?ul>\n?/g, "")
    .replace(/<li>\n(.*)\n/g, "## $1\n")
    .replace(/<\/li>\n?/g, "\n");
}

/** Returns the block that starts at the heading whose text contains `heading`, up to the next heading of the same or higher level. */
export function section(md: string, heading: string): string {
  const lines = md.split("\n");
  const start = lines.findIndex((l) => /^#{1,6} /.test(l) && l.replace(/\\/g, "").includes(heading));
  if (start < 0) return `_Section "${heading}" not found in the Notion snapshot._`;
  const level = lines[start].match(/^#+/)![0].length;
  let end = lines.length;
  for (let i = start + 1; i < lines.length; i++) {
    const h = lines[i].match(/^(#+) /);
    if (h && h[1].length <= level) { end = i; break; }
  }
  return lines.slice(start, end).join("\n");
}

export function shiftHeadings(md: string, by: number): string {
  if (!by) return md;
  return md.replace(/^(#{1,6}) /gm, (_, h) => "#".repeat(Math.min(6, h.length + by)) + " ");
}
