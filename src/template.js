import { escapeHtml as e } from "./markdown.js";

const FONTS =
  "https://fonts.googleapis.com/css2?family=Instrument+Sans:ital,wght@0,400;0,500;0,600;0,700;1,400&family=JetBrains+Mono:wght@400;500&display=swap";

// Runs before first paint so the page never flashes the wrong theme.
const THEME_BOOT = `(function(){try{var t=localStorage.getItem("docs-kit-theme");if(t==="light"||t==="dark")document.documentElement.dataset.theme=t;}catch(e){}})();`;

const ICONS = {
  search: '<svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="9" cy="9" r="5.5" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="m13.2 13.2 3.8 3.8" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>',
  menu: '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M3 6h14M3 10h14M3 14h14" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>',
  theme: '<svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="10" r="6.5" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M10 3.5a6.5 6.5 0 0 1 0 13z" fill="currentColor"/></svg>',
  copy: '<svg viewBox="0 0 20 20" aria-hidden="true"><rect x="7" y="7" width="9" height="10" rx="1.5" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M4 13V4.5A1.5 1.5 0 0 1 5.5 3H12" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>',
};

function asset(base, p) {
  if (!p) return "";
  return /^(https?:)?\/\//.test(p) ? p : base + p.replace(/^\//, "");
}

function brand(ctx) {
  const { config, base, pages } = ctx;
  const home = config.home ?? pages[0].url;
  const light = asset(base, config.logo?.light ?? config.logo);
  const dark = asset(base, config.logo?.dark ?? config.logo?.light ?? config.logo);
  const mark = light
    ? `<img class="logo logo-light" src="${e(light)}" alt="${e(config.name)}"><img class="logo logo-dark" src="${e(dark)}" alt="">`
    : `<span class="brand-name">${e(config.name)}</span>`;
  return `<a class="brand" href="${e(home)}">${mark}<span class="brand-tag">Docs</span></a>`;
}

function topbar(ctx, current) {
  const { config, pages } = ctx;
  const tabs = config.tabs
    .map((tab) => {
      const first = pages.find((p) => p.tab === tab.label);
      if (!first) return "";
      const on = current && current.tab === tab.label;
      return `<a class="tab${on ? " is-active" : ""}" href="${e(first.url)}"${on ? ' aria-current="true"' : ""}>${e(tab.label)}</a>`;
    })
    .join("");
  const links = (config.links ?? [])
    .map((l) => `<a class="top-link" href="${e(l.href)}">${e(l.label)}</a>`)
    .join("");
  return `
<header class="topbar">
  <div class="topbar-row">
    <button class="icon-btn menu-btn" type="button" aria-label="Open navigation" data-menu>${ICONS.menu}</button>
    ${brand(ctx)}
    <button class="search-btn" type="button" data-search-open aria-label="Search docs">${ICONS.search}<span>Search</span><kbd>⌘K</kbd></button>
    <div class="top-actions">${links}<button class="icon-btn" type="button" data-theme-toggle aria-label="Switch light or dark">${ICONS.theme}</button></div>
  </div>
  <nav class="tabs-row" aria-label="Sections">${tabs}</nav>
</header>`;
}

function sidebar(ctx, current) {
  const { config, pages } = ctx;
  const tab = config.tabs.find((t) => t.label === current.tab);
  const groups = tab.groups
    .map((g) => {
      const items = (g.pages ?? [])
        .map((slug) => pages.find((p) => p.slug === slug))
        .map((p) => {
          const on = p.slug === current.slug;
          return `<li><a href="${e(p.url)}"${on ? ' class="is-active" aria-current="page"' : ""}>${e(p.title)}</a></li>`;
        })
        .join("");
      return `<div class="nav-group">${g.group ? `<p class="nav-group-title">${e(g.group)}</p>` : ""}<ul>${items}</ul></div>`;
    })
    .join("");
  // On phones the drawer also carries the tabs.
  const tabs = config.tabs
    .map((t) => {
      const first = pages.find((p) => p.tab === t.label);
      return first ? `<a class="drawer-tab${t.label === current.tab ? " is-active" : ""}" href="${e(first.url)}">${e(t.label)}</a>` : "";
    })
    .join("");
  return `<aside class="sidebar" data-sidebar><nav aria-label="${e(current.tab)}"><div class="drawer-tabs">${tabs}</div>${groups}</nav></aside>`;
}

function toc(page) {
  if (page.toc.length < 2) return '<aside class="toc"></aside>';
  const items = page.toc
    .map((h) => `<li class="toc-${h.level}"><a href="#${e(h.id)}" data-toc-link>${e(h.text)}</a></li>`)
    .join("");
  return `<aside class="toc"><nav aria-label="On this page"><p class="toc-title">On this page</p><ul>${items}</ul></nav></aside>`;
}

function pager(prev, next) {
  if (!prev && !next) return "";
  const card = (p, dir) =>
    p ? `<a class="pager-${dir}" href="${e(p.url)}"><span>${dir === "prev" ? "Previous" : "Next"}</span>${e(p.title)}</a>` : "<span></span>";
  return `<nav class="pager" aria-label="Pages">${card(prev, "prev")}${card(next, "next")}</nav>`;
}

function head(ctx, title, description, canonical) {
  const { config, assets, base, site } = ctx;
  const accent = config.color ?? "#3a6df0";
  const accentDark = config.colorDark ?? accent;
  const favicon = asset(base, config.favicon);
  return `<!doctype html>
<html lang="${e(config.lang ?? "en")}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${e(title)}</title>
${description ? `<meta name="description" content="${e(description)}">` : ""}
${canonical && site ? `<link rel="canonical" href="${e(site + canonical)}">` : ""}
<meta property="og:title" content="${e(title)}">
${description ? `<meta property="og:description" content="${e(description)}">` : ""}
${favicon ? `<link rel="icon" href="${e(favicon)}">` : ""}
<link rel="alternate" type="text/plain" href="${e(base)}llms.txt" title="llms.txt">
<script>${THEME_BOOT}</script>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="${FONTS}">
<link rel="stylesheet" href="${e(assets.style)}">
<style>:root{--accent:${e(accent)}}:root[data-theme="dark"]{--accent:${e(accentDark)}}@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){--accent:${e(accentDark)}}}</style>
<script type="module" src="${e(assets.app)}"></script>
</head>`;
}

function searchDialog(base) {
  return `
<div class="search" data-search hidden>
  <div class="search-backdrop" data-search-close></div>
  <div class="search-panel" role="dialog" aria-modal="true" aria-label="Search docs">
    <div class="search-field">${ICONS.search}<input id="docs-search" type="search" placeholder="Search the docs" autocomplete="off" spellcheck="false" data-search-input data-index="${e(base)}search.json"><kbd data-search-close>Esc</kbd></div>
    <ul class="search-results" data-search-results></ul>
  </div>
</div>`;
}

export function renderPage(ctx, page, prev, next) {
  const { config } = ctx;
  const title = page.slug === "index" && page.title === config.name ? config.name : `${page.title} · ${config.name}`;
  const edit = config.repo
    ? `<a class="page-action" href="${e(`https://github.com/${config.repo}/edit/${config.branch ?? "main"}/${config.dir ?? "help"}/${page.slug}.md`)}" target="_blank" rel="noopener">Edit this page</a>`
    : "";
  return `${head(ctx, title, page.description, page.url)}
<body>
<a class="skip" href="#content">Skip to content</a>
${topbar(ctx, page)}
<div class="layout">
  ${sidebar(ctx, page)}
  <div class="scrim" data-scrim></div>
  <main id="content" class="content">
    <article class="page">
      <header class="page-head">
        ${page.group ? `<p class="eyebrow">${e(page.group)}</p>` : ""}
        <h1>${e(page.title)}</h1>
        ${page.description ? `<p class="lead">${e(page.description)}</p>` : ""}
        <div class="page-actions">
          <button class="page-action" type="button" data-copy-page="${e(page.mdUrl)}">${ICONS.copy}<span>Copy page</span></button>
          <a class="page-action" href="${e(page.mdUrl)}">View as Markdown</a>
          ${edit}
        </div>
      </header>
      <div class="prose">
${page.html}
      </div>
      ${pager(prev, next)}
    </article>
  </main>
  ${toc(page)}
</div>
${searchDialog(ctx.base)}
</body>
</html>
`;
}

export function renderNotFound(ctx) {
  const first = ctx.pages[0];
  return `${head(ctx, `Page not found · ${ctx.config.name}`, "", "")}
<body>
${topbar(ctx, null)}
<main class="not-found">
  <p class="eyebrow">404</p>
  <h1>This page isn't here</h1>
  <p class="lead">It may have moved. Search the docs, or start from the top.</p>
  <p><a class="button" href="${e(first.url)}">Go to ${e(first.title)}</a></p>
</main>
${searchDialog(ctx.base)}
</body>
</html>
`;
}

export function renderRedirect(url) {
  return `<!doctype html><meta charset="utf-8"><meta http-equiv="refresh" content="0; url=${e(url)}"><link rel="canonical" href="${e(url)}"><title>Redirecting</title><a href="${e(url)}">Continue</a>\n`;
}
