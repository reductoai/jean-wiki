import { expect, test } from "bun:test";
import { expand } from "./render.ts";
import { dashboard } from "./notiondb.ts";

test("cost table cells come from the workstream's Costs row", () => {
  const c = dashboard("more-apps")!.costs.find((r) => r.app === "Triton core vision")!;
  const ch = Math.round(((c.after - c.before) / c.before) * 100);
  const md = expand("| {{cost:more-apps/Triton core vision}} | {{verdict:more-apps/Triton core vision}} |", "/");
  expect(md).toBe(`| ${c.before.toFixed(2)} | ${c.after.toFixed(2)} | ${ch > 0 ? "+" : ""}${ch}% | ${c.after < c.before ? "Cheaper" : "Costlier"} |`);
});

test("a missing Costs row says so instead of showing a stale number", () => {
  expect(expand("{{cost:more-apps/No such app}} {{verdict:more-apps/No such app}}", "/")).toBe("no row | no row | no row no row");
});
