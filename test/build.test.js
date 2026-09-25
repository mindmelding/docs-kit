import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { build, BuildError, parseFrontMatter } from "../src/build.js";
import { createRenderer } from "../src/markdown.js";

async function fixture(files) {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "docs-kit-"));
  for (const [name, content] of Object.entries(files)) {
    await fs.mkdir(path.dirname(path.join(dir, name)), { recursive: true });
    await fs.writeFile(path.join(dir, name), content);
  }
  return dir;
}

const config = (pages, extra = {}) =>
  JSON.stringify({ name: "Test", base: "/t/docs/", tabs: [{ label: "Guide", groups: [{ group: "Start", pages }] }], ...extra });

test("front matter", () => {
  const { data, body } = parseFrontMatter("---\ntitle: Hello\ndescription: \"A page\"\n---\nBody");
  assert.equal(data.title, "Hello");
  assert.equal(data.description, "A page");
  assert.equal(body, "Body");
});

test("blocks render", async () => {
  const r = await createRenderer({ resolveHref: (h) => h });
  const { html } = r.render(
    ":::warning[Careful]\nText\n:::\n\n::::cards\n:::card[A](/a)\nx\n:::\n:::card[B]\ny\n:::\n::::\n\n::::steps\n### One\n::::\n\n::::tabs\n:::tab[npm]\nz\n:::\n::::\n",
  );
  assert.match(html, /<aside class="callout callout-warning"><p class="callout-title">Careful<\/p>/);
  assert.match(html, /<a class="card" href="\/a"><p class="card-title">A<\/p>/);
  assert.match(html, /<div class="card"><p class="card-title">B<\/p>[\s\S]*?<\/div>/);
  assert.match(html, /<div class="steps">/);
  assert.match(html, /<section class="tab-panel" data-label="npm">/);
});

test("builds pages under the base path with links resolved", async () => {
  const src = await fixture({
    "help.json": config(["index", "guides/setup"], { site: "https://example.com" }),
    "index.md": "---\ntitle: Home\ndescription: Start here\n---\nSee [setup](/guides/setup#step-two).\n\n## First\n\n## Second\n",
    "guides/setup.md": "---\ntitle: Setup\n---\nBack [home](/). ![Logo](/img/logo.png)\n",
    "img/logo.png": "png",
  });
  const out = path.join(src, "dist");
  const result = await build({ src, out });
  assert.equal(result.pages, 2);
  const home = await fs.readFile(path.join(out, "t/docs/index.html"), "utf8");
  assert.match(home, /href="\/t\/docs\/guides\/setup\/#step-two"/);
  assert.match(home, /<h2 id="first">/);
  const setup = await fs.readFile(path.join(out, "t/docs/guides/setup/index.html"), "utf8");
  assert.match(setup, /src="\/t\/docs\/img\/logo.png"/);
  assert.ok(await fs.stat(path.join(out, "t/docs/img/logo.png")));
  const llms = await fs.readFile(path.join(out, "t/docs/llms.txt"), "utf8");
  assert.match(llms, /\[Home\]\(https:\/\/example.com\/t\/docs\/index.md\): Start here/);
  const index = JSON.parse(await fs.readFile(path.join(out, "t/docs/search.json"), "utf8"));
  assert.deepEqual(index[0].s.map((s) => s.heading), ["", "First", "Second"]);
  assert.match(await fs.readFile(path.join(out, "index.html"), "utf8"), /url=\/t\/docs\//);
});

test("broken links fail the build", async () => {
  const src = await fixture({
    "help.json": config(["a"]),
    "a.md": "---\ntitle: A\n---\n[gone](/missing) and ![x](/nope.png)\n",
  });
  await assert.rejects(build({ src, out: path.join(src, "dist") }), (err) => {
    assert.ok(err instanceof BuildError);
    assert.match(err.message, /a\.md → \/missing/);
    assert.match(err.message, /a\.md → \/nope\.png/);
    return true;
  });
});

test("a page listed but missing fails the build", async () => {
  const src = await fixture({ "help.json": config(["ghost"]) });
  await assert.rejects(build({ src, out: path.join(src, "dist") }), /ghost/);
});

test("step headings stay out of the table of contents", async () => {
  const r = await createRenderer({ resolveHref: (h) => h });
  const { toc } = r.render("## Setup\n\n::::steps\n### Install\n::::\n\n### Later\n", {});
  assert.deepEqual(toc.map((h) => h.text), ["Setup", "Later"]);
});
