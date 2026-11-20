import { expect, test } from "bun:test";
import { notionToMarkdown, section, shiftHeadings } from "./notion.ts";

test("converts Notion tags to Markdown and HTML", () => {
  const md = notionToMarkdown('<mention url="https://x">X</mention> <date start="2026-11-16" start-time="15:46" time-zone="America/Los_Angeles" />\n<ul>\n<li>\nAU\n\n- a\n</li>\n</ul>\n');
  expect(md).toContain('<a href="https://x">X</a> 2026-11-16 15:46 PT');
  expect(md).toContain("## AU\n");
  expect(md).not.toContain("<li>");
});

test("section stops at the next heading of the same level", () => {
  const md = "## A\n### \\[p0\\] One\nx\n### Two\ny";
  expect(section(md, "[p0] One")).toBe("### \\[p0\\] One\nx");
  expect(shiftHeadings("# P", 2)).toBe("### P");
});
