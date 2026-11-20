(() => {
  const form = document.querySelector(".cm-form");
  if (!form) return;
  const page = document.body.dataset.page;
  const api = (p, body) => fetch(`${window.WIKI_BASE}api/${p}?page=${encodeURIComponent(page)}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) }).then((r) => r.json());
  const quoteBox = form.querySelector(".cm-quote"), quoteText = quoteBox.querySelector("blockquote");
  let quote = "";
  const setQuote = (q) => { quote = q; quoteText.textContent = q; quoteBox.hidden = !q; };
  form.querySelector(".cm-unquote").onclick = () => setQuote("");

  const pop = document.createElement("button");
  pop.className = "cm-pop"; pop.textContent = "Comment"; pop.hidden = true;
  document.body.append(pop);
  document.addEventListener("mouseup", (e) => {
    if (e.target === pop) return;
    setTimeout(() => {
      const sel = getSelection(), text = sel && sel.toString().trim();
      const art = document.querySelector("main article");
      if (!text || !art || !art.contains(sel.anchorNode)) return (pop.hidden = true);
      const r = sel.getRangeAt(0).getBoundingClientRect();
      pop.style.top = `${scrollY + r.top - 34}px`; pop.style.left = `${scrollX + r.left + r.width / 2 - 40}px`;
      pop.hidden = false; pop.dataset.text = text.slice(0, 500);
    });
  });
  pop.onclick = () => {
    setQuote(pop.dataset.text); pop.hidden = true; getSelection().removeAllRanges();
    form.scrollIntoView({ behavior: "smooth", block: "center" }); form.querySelector("textarea").focus();
  };

  form.onsubmit = async (e) => {
    e.preventDefault();
    const ta = form.querySelector("textarea"), text = ta.value.trim();
    if (!text) return;
    const r = await api("comment", { text, quote });
    if (r.error) return alert(r.error);
    ta.value = ""; setQuote("");
  };
  document.addEventListener("click", async (e) => {
    const b = e.target.closest(".cm-resolve");
    if (!b) return;
    const r = await api("comment/resolve", { id: b.dataset.id, resolved: b.dataset.resolved === "true" });
    if (r.error) alert(r.error);
  });

  const mark = () => {
    const art = document.querySelector("main article");
    if (!art) return;
    for (const q of document.querySelectorAll(".comment:not(.resolved) blockquote")) {
      const needle = q.textContent;
      const walk = document.createTreeWalker(art, NodeFilter.SHOW_TEXT);
      for (let n; (n = walk.nextNode()); ) {
        const i = n.data.indexOf(needle);
        if (i < 0) continue;
        const r = document.createRange(); r.setStart(n, i); r.setEnd(n, i + needle.length);
        const m = document.createElement("mark"); m.className = "cm-mark"; m.title = "Commented";
        m.onclick = () => q.closest(".comment").scrollIntoView({ behavior: "smooth", block: "center" });
        r.surroundContents(m);
        break;
      }
    }
  };
  mark();
  window.addEventListener("wiki:updated", mark);
})();
