const slug = document.body.dataset.page;
const api = (p) => `${window.WIKI_BASE}api/${p}?page=${encodeURIComponent(slug)}`;
const md = document.getElementById("md");
const preview = document.getElementById("preview");
let timer;
async function refresh() {
  const r = await fetch(api("preview"), { method: "POST", body: JSON.stringify({ markdown: md.value }) });
  preview.innerHTML = (await r.json()).html;
  window.renderDiagrams?.(preview);
}
md.addEventListener("input", () => { clearTimeout(timer); timer = setTimeout(refresh, 300); });
document.getElementById("save").onclick = async () => {
  const r = await fetch(api("save"), { method: "POST", body: JSON.stringify({ markdown: md.value }) });
  if (r.ok) location.href = location.pathname; else alert((await r.json()).error);
};
document.getElementById("share").onclick = async () => {
  const mode = document.querySelector("input[name=mode]:checked").value;
  const emails = document.getElementById("emails").value.split(/[\s,]+/);
  const r = await fetch(api("share"), { method: "POST", body: JSON.stringify({ mode, emails }) });
  document.getElementById("share-state").textContent = r.ok ? " Saved. Send them this page's link." : " Failed.";
};
document.querySelectorAll("[data-version]").forEach((a) => (a.onclick = async (e) => {
  e.preventDefault();
  const r = await fetch(api("version") + `&file=${encodeURIComponent(a.dataset.version)}`);
  if (r.ok) { md.value = (await r.json()).markdown; refresh(); }
}));
refresh();
