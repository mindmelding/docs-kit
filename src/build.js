import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
import { createRenderer, escapeHtml } from "./markdown.js";
import { renderPage, renderNotFound, renderRedirect } from "./template.js";

const THEME_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), "theme");
const EXTERNAL = /^(?:[a-z][a-z0-9+.-]*:|\/\/|#)/i;

export class BuildError extends Error {}

function normalizeBase(base = "/") {
  let b = base.trim();
  if (!b.startsWith("/")) b = "/" + b;
  if (!b.endsWith("/")) b += "/";
  return b.replace(/\/+/g, "/");
}

// A tiny front-matter reader: `key: value` lines between --- fences.
export function parseFrontMatter(source) {
  const m = source.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!m) return { data: {}, body: source };
  const data = {};
  for (const line of m[1].split(/\r?\n/)) {
    const kv = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (kv) data[kv[1]] = kv[2].replace(/^["']|["']$/g, "").trim();
  }
  return { data, body: source.slice(m[0].length) };
}

const pageUrl = (base, slug) => (slug === "index" ? base : `${base}${slug}/`);

function plainText(markdown) {
  return markdown
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/^:{3,}.*$/gm, " ")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/<[^>]+>/g, " ")
    .replace(/[`*_>#|]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// Split a page into sections at ## and ### headings for search.
function searchSections(body, toc) {
  const parts = body.split(/^#{2,3}\s+.*$/m);
  const sections = [{ id: "", heading: "", text: plainText(parts[0]).slice(0, 600) }];
  toc.forEach((h, i) => {
    sections.push({ id: h.id, heading: h.text, text: plainText(parts[i + 1] ?? "").slice(0, 600) });
  });
  return sections.filter((s) => s.heading || s.text);
}

async function exists(p) {
  try { await fs.access(p); return true; } catch { return false; }
}

async function copyDir(from, to, skip) {
  const entries = await fs.readdir(from, { withFileTypes: true });
  for (const e of entries) {
    if (e.name.startsWith(".")) continue;
    const src = path.join(from, e.name);
    if (skip(src, e)) continue;
    const dest = path.join(to, e.name);
    if (e.isDirectory()) {
      await fs.mkdir(dest, { recursive: true });
      await copyDir(src, dest, skip);
    } else {
      await fs.copyFile(src, dest);
    }
  }
}

export async function loadConfig(srcDir) {
  const file = path.join(srcDir, "help.json");
  let raw;
  try {
    raw = await fs.readFile(file, "utf8");
  } catch {
    throw new BuildError(`No help.json in ${srcDir}. Run \`docs-kit init ${srcDir}\` to start one.`);
  }
  let config;
  try {
    config = JSON.parse(raw);
  } catch (e) {
    throw new BuildError(`help.json is not valid JSON: ${e.message}`);
  }
  if (!config.name) throw new BuildError("help.json needs a \"name\".");
  if (!Array.isArray(config.tabs) || !config.tabs.length) throw new BuildError("help.json needs at least one entry in \"tabs\".");
  return config;
}

export async function build({ src = "help", out = "dist", base, site } = {}) {
  const srcDir = path.resolve(src);
  const config = await loadConfig(srcDir);
  const docsBase = normalizeBase(base ?? config.base ?? "/");
  const siteUrl = (site ?? config.site ?? "").replace(/\/$/, "");
  const outRoot = path.resolve(out);
  const outDir = path.join(outRoot, docsBase);

  // Every page listed in the nav, in order.
  const pages = [];
  const seen = new Set();
  for (const tab of config.tabs) {
    if (!tab.label || !Array.isArray(tab.groups)) throw new BuildError(`Each tab needs a "label" and "groups": ${JSON.stringify(tab).slice(0, 80)}`);
    for (const group of tab.groups) {
      for (const slug of group.pages ?? []) {
        if (seen.has(slug)) throw new BuildError(`Page "${slug}" is listed twice in help.json.`);
        seen.add(slug);
        pages.push({ slug, tab: tab.label, group: group.group ?? "" });
      }
    }
  }

  const links = []; // internal links to check after the build
  const renderer = await createRenderer({
    resolveHref(href, env) {
      if (EXTERNAL.test(href)) return href;
      const [pathPart, hash = ""] = href.split("#");
      let target = pathPart.startsWith("/")
        ? pathPart.slice(1)
        : path.posix.normalize(path.posix.join(path.posix.dirname(env.slug ?? ""), pathPart));
      target = target.replace(/\/$/, "").replace(/\.md$/, "");
      if (target === "." || target === "") target = "index";
      links.push({ from: env.slug, target, href });
      const isAsset = /\.[a-z0-9]{2,5}$/i.test(target);
      const url = isAsset ? docsBase + target : pageUrl(docsBase, target);
      return hash ? `${url}#${hash}` : url;
    },
  });

  for (const page of pages) {
    const file = path.join(srcDir, `${page.slug}.md`);
    if (!(await exists(file))) throw new BuildError(`help.json lists "${page.slug}" but ${path.relative(process.cwd(), file)} does not exist.`);
    const source = await fs.readFile(file, "utf8");
    const { data, body } = parseFrontMatter(source);
    const env = { slug: page.slug };
    const { html, toc } = renderer.render(body, env);
    Object.assign(page, {
      source: body,
      title: data.title || page.slug,
      description: data.description || "",
      html,
      toc,
      url: pageUrl(docsBase, page.slug),
      mdUrl: `${docsBase}${page.slug}.md`,
    });
  }

  // Broken internal links fail the build.
  const slugs = new Set(pages.map((p) => p.slug));
  const broken = [];
  for (const l of links) {
    if (/\.[a-z0-9]{2,5}$/i.test(l.target)) {
      if (!(await exists(path.join(srcDir, l.target)))) broken.push(l);
    } else if (!slugs.has(l.target)) {
      broken.push(l);
    }
  }
  if (broken.length) {
    throw new BuildError(
      "Broken links:\n" + broken.map((l) => `  ${l.from}.md → ${l.href}`).join("\n"),
    );
  }

  await fs.rm(outRoot, { recursive: true, force: true });
  await fs.mkdir(outDir, { recursive: true });

  // Theme files, fingerprinted so browsers never run a stale copy.
  const kitDir = path.join(outDir, "_kit");
  await fs.mkdir(kitDir, { recursive: true });
  const assets = {};
  for (const name of ["style.css", "app.js"]) {
    const content = await fs.readFile(path.join(THEME_DIR, name), "utf8");
    const hash = createHash("sha1").update(content).digest("hex").slice(0, 8);
    const [stem, ext] = name.split(".");
    const fileName = `${stem}.${hash}.${ext}`;
    await fs.writeFile(path.join(kitDir, fileName), content);
    assets[stem] = `${docsBase}_kit/${fileName}`;
  }

  // Images and other files from the source folder.
  // Skip the output folder itself, which may sit inside the docs folder.
  await copyDir(
    srcDir,
    outDir,
    (p, e) =>
      p === outRoot ||
      p.startsWith(outRoot + path.sep) ||
      e.name === "node_modules" ||
      /^wrangler\.(jsonc?|toml)$/.test(e.name) ||
      (e.isFile() && (p.endsWith(".md") || p.endsWith("help.json"))),
  );

  const ctx = { config, base: docsBase, site: siteUrl, pages, assets };
  for (let i = 0; i < pages.length; i++) {
    const page = pages[i];
    const html = renderPage(ctx, page, pages[i - 1], pages[i + 1]);
    const dir = page.slug === "index" ? outDir : path.join(outDir, page.slug);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(path.join(dir, "index.html"), html);
    await fs.mkdir(path.dirname(path.join(outDir, `${page.slug}.md`)), { recursive: true });
    await fs.writeFile(
      path.join(outDir, `${page.slug}.md`),
      `# ${page.title}\n\n${page.description ? `> ${page.description}\n\n` : ""}${page.source.trim()}\n`,
    );
  }

  // Docs root: the first page when there is no index page.
  if (!slugs.has("index")) await fs.writeFile(path.join(outDir, "index.html"), renderRedirect(pages[0].url));
  if (docsBase !== "/") await fs.writeFile(path.join(outRoot, "index.html"), renderRedirect(docsBase));
  await fs.writeFile(path.join(outDir, "404.html"), renderNotFound(ctx));
  if (docsBase !== "/") await fs.writeFile(path.join(outRoot, "404.html"), renderNotFound(ctx));

  // Search index.
  const index = pages.map((p) => ({
    t: p.title,
    d: p.description,
    u: p.url,
    tab: p.tab,
    s: searchSections(p.source, p.toc),
  }));
  await fs.writeFile(path.join(outDir, "search.json"), JSON.stringify(index));

  // llms.txt and llms-full.txt (https://llmstxt.org).
  const abs = (u) => (siteUrl ? siteUrl + u : u);
  const llms = [`# ${config.name}`, "", config.description ? `> ${config.description}\n` : ""];
  for (const tab of config.tabs) {
    llms.push(`## ${tab.label}`, "");
    for (const p of pages.filter((x) => x.tab === tab.label)) {
      llms.push(`- [${p.title}](${abs(p.mdUrl)})${p.description ? `: ${p.description}` : ""}`);
    }
    llms.push("");
  }
  await fs.writeFile(path.join(outDir, "llms.txt"), llms.join("\n"));
  await fs.writeFile(
    path.join(outDir, "llms-full.txt"),
    pages.map((p) => `# ${p.title}\n\nSource: ${abs(p.url)}\n\n${p.source.trim()}\n`).join("\n---\n\n"),
  );

  if (siteUrl) {
    const urls = pages.map((p) => `  <url><loc>${escapeHtml(siteUrl + p.url)}</loc></url>`).join("\n");
    await fs.writeFile(
      path.join(outDir, "sitemap.xml"),
      `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`,
    );
  }

  return { pages: pages.length, outDir, base: docsBase };
}
