#!/usr/bin/env node
import fs from "node:fs";
import fsp from "node:fs/promises";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { build, BuildError } from "../src/build.js";

const HELP = `docs-kit: a folder of Markdown in, a docs site out.

Usage
  docs-kit build [dir]   Build the docs in [dir] (default: help) into ./dist
  docs-kit dev [dir]     Build, serve on http://localhost:4321 and rebuild on save
  docs-kit init [dir]    Start a new docs folder with a help.json and two pages

Options
  --out <dir>     Output folder (default: dist)
  --base <path>   URL path the docs live under, e.g. /buoy/docs/ (default: help.json "base", or /)
  --site <url>    Site origin for canonical links, llms.txt and the sitemap
  --port <n>      Port for dev (default: 4321)
`;

function parseArgs(argv) {
  const args = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith("--")) {
      const [k, v] = a.slice(2).split("=");
      args[k] = v ?? argv[++i];
    } else {
      args._.push(a);
    }
  }
  return args;
}

async function runBuild(opts) {
  const started = Date.now();
  const result = await build(opts);
  console.log(`Built ${result.pages} pages at ${result.base} → ${path.relative(process.cwd(), result.outDir) || "."} (${Date.now() - started} ms)`);
  return result;
}

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json",
  ".md": "text/markdown; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".xml": "application/xml",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".ico": "image/x-icon",
};

async function dev(opts, port) {
  const outRoot = path.resolve(opts.out);
  let result = await runBuild(opts).catch(report);
  const clients = new Set();
  const RELOAD = `<script>new EventSource("/__reload").onmessage=()=>location.reload()</script>`;

  http
    .createServer(async (req, res) => {
      if (req.url === "/__reload") {
        res.writeHead(200, { "content-type": "text/event-stream", "cache-control": "no-cache" });
        clients.add(res);
        req.on("close", () => clients.delete(res));
        return;
      }
      let file = path.join(outRoot, decodeURIComponent(req.url.split("?")[0]));
      try {
        if ((await fsp.stat(file)).isDirectory()) file = path.join(file, "index.html");
        let body = await fsp.readFile(file);
        const type = TYPES[path.extname(file)] ?? "application/octet-stream";
        if (type.startsWith("text/html")) body = body.toString().replace("</body>", `${RELOAD}</body>`);
        res.writeHead(200, { "content-type": type });
        res.end(body);
      } catch {
        const notFound = path.join(outRoot, result?.base ?? "/", "404.html");
        res.writeHead(404, { "content-type": "text/html; charset=utf-8" });
        res.end(fs.existsSync(notFound) ? fs.readFileSync(notFound, "utf8").replace("</body>", `${RELOAD}</body>`) : "Not found");
      }
    })
    .listen(port, () => console.log(`Serving on http://localhost:${port}${result?.base ?? "/"}`));

  let timer;
  fs.watch(path.resolve(opts.src), { recursive: true }, () => {
    clearTimeout(timer);
    timer = setTimeout(async () => {
      result = (await runBuild(opts).catch(report)) ?? result;
      for (const c of clients) c.write("data: reload\n\n");
    }, 120);
  });
}

async function init(dir) {
  const target = path.resolve(dir);
  if (fs.existsSync(path.join(target, "help.json"))) {
    console.log(`${dir}/help.json already exists. Nothing to do.`);
    return;
  }
  const starter = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "src", "starter");
  await fsp.mkdir(target, { recursive: true });
  for (const name of await fsp.readdir(starter)) {
    await fsp.copyFile(path.join(starter, name), path.join(target, name));
  }
  console.log(`Started ${dir}/ with help.json, what-is.md and quickstart.md.\nEdit help.json (name, color, base), then run: docs-kit dev ${dir}`);
}

function report(err) {
  if (err instanceof BuildError) {
    console.error(`\n✗ ${err.message}\n`);
  } else {
    console.error(err);
  }
  return undefined;
}

const args = parseArgs(process.argv.slice(2));
const [command, dir = "help"] = args._;
const opts = { src: dir, out: args.out ?? "dist", base: args.base, site: args.site };

try {
  if (command === "build") await runBuild(opts);
  else if (command === "dev") await dev(opts, Number(args.port ?? 4321));
  else if (command === "init") await init(dir);
  else console.log(HELP);
} catch (err) {
  report(err);
  process.exit(1);
}
