// Markdown → HTML, with the docs-kit blocks:
//
//   :::note[Optional title]      callouts: note, tip, warning, danger
//   ::::cards                    a grid of link cards
//   :::card[Title](/link)
//   ::::steps                    each ### heading inside becomes a numbered step
//   ::::tabs / :::tab[Label]     switchable panels
//
// Nested blocks use more colons on the outer fence than the inner one.
import MarkdownIt from "markdown-it";
import container from "markdown-it-container";
import { createHighlighter } from "shiki";

const CALLOUTS = ["note", "tip", "warning", "danger"];
const LANGS = [
  "bash", "shell", "json", "jsonc", "yaml", "toml", "javascript", "typescript",
  "jsx", "tsx", "html", "css", "python", "sql", "markdown", "diff", "http", "ini",
];

let highlighterPromise;
function getHighlighter() {
  highlighterPromise ??= createHighlighter({
    themes: ["github-light", "github-dark"],
    langs: LANGS,
  });
  return highlighterPromise;
}

export const escapeHtml = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

export function slugify(text) {
  return String(text)
    .toLowerCase()
    .replace(/<[^>]+>/g, "")
    .replace(/&[a-z]+;/g, "")
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

// markdown-it-container's default check needs a space after the name,
// which rejects `note[Title]`. Accept a bracket, a space or nothing.
const named = (name) => (params) => new RegExp(`^${name}(?:[\\[\\s]|$)`).test(params.trim());

// Parses `[Label](href)` or `[Label]` after a block name.
function parseInfo(info, name) {
  const rest = info.trim().slice(name.length).trim();
  const m = rest.match(/^\[([^\]]*)\](?:\(([^)]*)\))?/);
  return { label: m ? m[1] : rest, href: m && m[2] ? m[2] : "" };
}

export async function createRenderer({ resolveHref }) {
  const highlighter = await getHighlighter();
  const md = new MarkdownIt({
    html: true,
    linkify: true,
    typographer: false,
    highlight(code, lang) {
      const language = LANGS.includes(lang) ? lang : "text";
      const html = highlighter.codeToHtml(code, {
        lang: language,
        themes: { light: "github-light", dark: "github-dark" },
        defaultColor: false,
      });
      const label = lang ? `<span class="code-lang">${escapeHtml(lang)}</span>` : "";
      return `<div class="code">${label}<button class="code-copy" type="button" aria-label="Copy code">Copy</button>${html}</div>`;
    },
  });

  // Prefix site-relative links and images with the docs base path.
  for (const rule of ["link_open", "image"]) {
    const attr = rule === "image" ? "src" : "href";
    const original = md.renderer.rules[rule] ?? ((t, i, o, e, s) => s.renderToken(t, i, o));
    md.renderer.rules[rule] = (tokens, idx, options, env, self) => {
      const token = tokens[idx];
      const value = token.attrGet(attr);
      if (value) {
        const resolved = resolveHref(value, env);
        token.attrSet(attr, resolved);
        if (rule === "link_open" && /^https?:\/\//.test(resolved)) {
          token.attrSet("target", "_blank");
          token.attrSet("rel", "noopener");
        }
      }
      return original(tokens, idx, options, env, self);
    };
  }

  // Heading ids, collected for the table of contents.
  md.renderer.rules.heading_open = (tokens, idx, options, env, self) => {
    const token = tokens[idx];
    const level = Number(token.tag.slice(1));
    const inline = tokens[idx + 1];
    const text = inline.children.map((c) => (c.type === "code_inline" ? c.content : c.content ?? "")).join("");
    env.slugs ??= new Map();
    let id = slugify(text) || "section";
    const seen = env.slugs.get(id) ?? 0;
    env.slugs.set(id, seen + 1);
    if (seen) id = `${id}-${seen}`;
    token.attrSet("id", id);
    // Step titles stay out of the table of contents; they'd crowd it.
    if (level === 2 || (level === 3 && !env.inSteps)) (env.toc ??= []).push({ level, id, text });
    return self.renderToken(tokens, idx, options) + `<a class="anchor" href="#${id}" aria-label="Link to this section">#</a>`;
  };

  // Tables scroll inside their own box on small screens.
  md.renderer.rules.table_open = () => '<div class="table-wrap"><table>';
  md.renderer.rules.table_close = () => "</table></div>";

  for (const kind of CALLOUTS) {
    md.use(container, kind, {
      validate: named(kind),
      render(tokens, idx) {
        const t = tokens[idx];
        if (t.nesting === 1) {
          const { label } = parseInfo(t.info, kind);
          const title = label || kind[0].toUpperCase() + kind.slice(1);
          return `<aside class="callout callout-${kind}"><p class="callout-title">${escapeHtml(title)}</p>\n`;
        }
        return "</aside>\n";
      },
    });
  }

  md.use(container, "cards", {
    validate: named("cards"),
    render: (tokens, idx) => (tokens[idx].nesting === 1 ? '<div class="cards">\n' : "</div>\n"),
  });
  md.use(container, "card", {
    validate: named("card"),
    render(tokens, idx, options, env) {
      const t = tokens[idx];
      if (t.nesting === 1) {
        const { label, href } = parseInfo(t.info, "card");
        const title = `<p class="card-title">${escapeHtml(label)}</p>`;
        return href
          ? `<a class="card" href="${escapeHtml(resolveHref(href, env))}">${title}\n`
          : `<div class="card">${title}\n`;
      }
      // Find the matching opener to close the right tag.
      let depth = 0;
      for (let i = idx - 1; i >= 0; i--) {
        if (tokens[i].type === "container_card_close") depth++;
        if (tokens[i].type === "container_card_open") {
          if (depth === 0) return parseInfo(tokens[i].info, "card").href ? "</a>\n" : "</div>\n";
          depth--;
        }
      }
      return "</div>\n";
    },
  });

  md.use(container, "steps", {
    validate: named("steps"),
    render(tokens, idx, options, env) {
      env.inSteps = tokens[idx].nesting === 1;
      return env.inSteps ? '<div class="steps">\n' : "</div>\n";
    },
  });

  md.use(container, "tabs", {
    validate: named("tabs"),
    render: (tokens, idx) => (tokens[idx].nesting === 1 ? '<div class="tabs" data-tabs>\n' : "</div>\n"),
  });
  md.use(container, "tab", {
    validate: named("tab"),
    render(tokens, idx) {
      const t = tokens[idx];
      if (t.nesting === 1) {
        const { label } = parseInfo(t.info, "tab");
        return `<section class="tab-panel" data-label="${escapeHtml(label)}">\n`;
      }
      return "</section>\n";
    },
  });

  return {
    render(source, env = {}) {
      const html = md.render(source, env);
      return { html, toc: env.toc ?? [] };
    },
  };
}
