(() => {
  if (document.body.classList.contains("editing")) return;
  const es = new EventSource(`${window.WIKI_BASE}api/events`);
  es.onmessage = (e) => {
    const { slug } = JSON.parse(e.data);
    if (slug === "*" || slug === document.body.dataset.page) {
      if (document.querySelector(".diagram")) return location.reload();
      const y = scrollY;
      fetch(location.href).then((r) => r.text()).then((html) => {
        const doc = new DOMParser().parseFromString(html, "text/html");
        for (const sel of ["main article", "nav.side", "aside.toc"]) {
          const a = document.querySelector(sel), b = doc.querySelector(sel);
          if (a && b) a.replaceWith(b);
        }
        scrollTo(0, y);
        window.dispatchEvent(new Event("wiki:updated"));
      });
    }
  };
})();
