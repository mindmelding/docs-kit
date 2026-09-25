// docs-kit client: theme toggle, phone drawer, search, copy buttons, tabs, table of contents.
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const root = document.documentElement;

function store(key, value) {
  try {
    if (value === undefined) return localStorage.getItem(key);
    localStorage.setItem(key, value);
  } catch {
    return null;
  }
}

async function copyText(text, button, label) {
  try {
    await navigator.clipboard.writeText(text);
    const span = button.querySelector("span") ?? button;
    const before = span.textContent;
    span.textContent = "Copied";
    setTimeout(() => (span.textContent = label ?? before), 1400);
  } catch {
    // Clipboard refused; leave the button as it was.
  }
}

/* Theme */
$("[data-theme-toggle]")?.addEventListener("click", () => {
  const dark = root.dataset.theme
    ? root.dataset.theme === "dark"
    : matchMedia("(prefers-color-scheme: dark)").matches;
  root.dataset.theme = dark ? "light" : "dark";
  store("docs-kit-theme", root.dataset.theme);
});

/* Phone drawer */
const sidebar = $("[data-sidebar]");
const scrim = $("[data-scrim]");
function setDrawer(open) {
  sidebar?.classList.toggle("is-open", open);
  scrim?.classList.toggle("is-open", open);
}
$("[data-menu]")?.addEventListener("click", () => setDrawer(!sidebar?.classList.contains("is-open")));
scrim?.addEventListener("click", () => setDrawer(false));
$(".sidebar .is-active")?.scrollIntoView({ block: "center" });

/* Copy code and copy page */
for (const btn of $$(".code-copy")) {
  btn.addEventListener("click", () => copyText(btn.parentElement.querySelector("pre").innerText, btn, "Copy"));
}
for (const btn of $$("[data-copy-page]")) {
  btn.addEventListener("click", async () => {
    try {
      const res = await fetch(btn.dataset.copyPage);
      await copyText(await res.text(), btn, "Copy page");
    } catch {
      /* offline: nothing to copy */
    }
  });
}

/* Tabs inside pages */
for (const [n, tabs] of $$("[data-tabs]").entries()) {
  const panels = $$(":scope > .tab-panel", tabs);
  const list = document.createElement("div");
  list.className = "tab-list";
  list.setAttribute("role", "tablist");
  const buttons = panels.map((panel, i) => {
    const b = document.createElement("button");
    b.type = "button";
    b.textContent = panel.dataset.label || `Tab ${i + 1}`;
    b.id = `tab-${n}-${i}`;
    b.setAttribute("role", "tab");
    panel.setAttribute("role", "tabpanel");
    panel.setAttribute("aria-labelledby", b.id);
    b.addEventListener("click", () => select(i));
    list.append(b);
    return b;
  });
  function select(i) {
    buttons.forEach((b, j) => b.setAttribute("aria-selected", String(i === j)));
    panels.forEach((p, j) => (p.hidden = i !== j));
  }
  tabs.prepend(list);
  tabs.classList.add("is-ready");
  select(0);
}

/* Table of contents: highlight the section in view */
const tocLinks = $$("[data-toc-link]");
if (tocLinks.length) {
  const byId = new Map(tocLinks.map((a) => [decodeURIComponent(a.hash.slice(1)), a]));
  const headings = [...byId.keys()].map((id) => document.getElementById(id)).filter(Boolean);
  const onScroll = () => {
    const offset = parseFloat(getComputedStyle(root).scrollPaddingTop) || 120;
    let current = headings[0];
    for (const h of headings) if (h.getBoundingClientRect().top - offset <= 8) current = h;
    tocLinks.forEach((a) => a.classList.toggle("is-active", byId.get(current?.id) === a));
  };
  addEventListener("scroll", onScroll, { passive: true });
  onScroll();
}

/* Search */
const dialog = $("[data-search]");
const input = $("[data-search-input]");
const results = $("[data-search-results]");
let index = null;
let active = 0;

async function loadIndex() {
  if (index) return index;
  try {
    index = await (await fetch(input.dataset.index)).json();
  } catch {
    index = [];
  }
  return index;
}

function openSearch() {
  dialog.hidden = false;
  input.focus();
  input.select();
  loadIndex().then(() => runSearch(input.value));
}
function closeSearch() {
  dialog.hidden = true;
}

const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
function highlight(text, terms) {
  let out = esc(text);
  for (const t of terms) out = out.replace(new RegExp(`(${t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi"), "<mark>$1</mark>");
  return out;
}
function snippet(text, terms) {
  const lower = text.toLowerCase();
  const at = Math.max(0, Math.min(...terms.map((t) => lower.indexOf(t)).filter((i) => i >= 0), text.length) - 40);
  return (at > 0 ? "…" : "") + text.slice(at, at + 160);
}

function runSearch(query) {
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (!terms.length || !index) {
    results.innerHTML = "";
    return;
  }
  const hits = [];
  for (const page of index) {
    for (const s of page.s) {
      const title = (s.heading || page.t).toLowerCase();
      const body = s.text.toLowerCase();
      const all = `${page.t} ${s.heading} ${s.text} ${page.d}`.toLowerCase();
      if (!terms.every((t) => all.includes(t))) continue;
      let score = 0;
      for (const t of terms) {
        if (page.t.toLowerCase().includes(t)) score += s.heading ? 3 : 8;
        if (title.includes(t)) score += 5;
        if (body.includes(t)) score += 1;
      }
      hits.push({ page, s, score });
    }
  }
  hits.sort((a, b) => b.score - a.score);
  const top = hits.slice(0, 12);
  active = 0;
  if (!top.length) {
    results.innerHTML = `<li class="search-empty">Nothing matches “${esc(query)}”.</li>`;
    return;
  }
  results.innerHTML = top
    .map(({ page, s }, i) => {
      const url = s.id ? `${page.u}#${s.id}` : page.u;
      const title = s.heading || page.t;
      const path = s.heading ? `${page.tab} › ${page.t}` : page.tab;
      const text = s.text || page.d;
      return `<li><a href="${esc(url)}"${i === 0 ? ' class="is-active"' : ""}><span class="r-title">${highlight(title, terms)}</span><span class="r-path">${esc(path)}</span>${text ? `<span class="r-text">${highlight(snippet(text, terms), terms)}</span>` : ""}</a></li>`;
    })
    .join("");
}

function move(delta) {
  const links = $$("a", results);
  if (!links.length) return;
  active = (active + delta + links.length) % links.length;
  links.forEach((a, i) => a.classList.toggle("is-active", i === active));
  links[active].scrollIntoView({ block: "nearest" });
}

if (dialog) {
  $$("[data-search-open]").forEach((b) => b.addEventListener("click", openSearch));
  $$("[data-search-close]").forEach((b) => b.addEventListener("click", closeSearch));
  input.addEventListener("input", () => runSearch(input.value));
  results.addEventListener("click", (e) => {
    if (e.target.closest("a")) closeSearch();
  });
  addEventListener("keydown", (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
      e.preventDefault();
      dialog.hidden ? openSearch() : closeSearch();
    } else if (e.key === "/" && dialog.hidden && !/input|textarea/i.test(document.activeElement.tagName)) {
      e.preventDefault();
      openSearch();
    } else if (!dialog.hidden) {
      if (e.key === "Escape") closeSearch();
      if (e.key === "ArrowDown") { e.preventDefault(); move(1); }
      if (e.key === "ArrowUp") { e.preventDefault(); move(-1); }
      if (e.key === "Enter") {
        const a = $$("a", results)[active];
        if (a) { closeSearch(); location.href = a.href; }
      }
    }
  });
}
