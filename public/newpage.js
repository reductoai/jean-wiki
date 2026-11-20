document.querySelectorAll(".new-page").forEach((b) => b.addEventListener("click", async () => {
  const title = prompt("New page title");
  if (!title) return;
  const r = await fetch(`${window.WIKI_BASE}api/new-page`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ chapter: b.dataset.chapter, title }) });
  const d = await r.json();
  if (d.ok) location.href = `${window.WIKI_BASE}${d.path}?edit`; else alert(d.error);
}));
