# docs-kit

A folder of Markdown in, a docs site out.

docs-kit builds product docs with the layout people know from the best developer docs: tabs across the top, a grouped sidebar, a table of contents that follows your scroll, search on ⌘K, and light and dark themes. The output is static HTML, so it runs on any host for free. Every page also ships as Markdown, with `llms.txt`, so AI agents can read your docs as easily as people.

**Docs:** https://mindmelding.vercel.app/docs-kit/docs

## Start

You need Node.js 20 or newer.

```bash
npx github:mindmelding/docs-kit init help    # help/help.json and two starter pages
npx github:mindmelding/docs-kit dev help     # http://localhost:4321, reloads on save
npx github:mindmelding/docs-kit build help   # static site in dist/
```

## A page

```markdown
---
title: Connect Slack
description: Send alerts to a channel your team already reads.
---

Pick the channel, then choose which alerts go there.

:::tip
Start with one channel. You can add more later.
:::

::::steps
### Open settings
Go to **Settings → Integrations**.

### Connect
Choose **Slack** and approve the request.
::::
```

Blocks: `:::note`, `:::tip`, `:::warning`, `:::danger`, `::::cards`, `::::steps` and `::::tabs`. Everything else is standard Markdown that still reads well on GitHub. The [blocks page](https://mindmelding.vercel.app/docs-kit/docs/blocks/) shows each one.

## The config

`help/help.json` names the product, sets the accent color and the path the docs live under, and lists the pages in sidebar order:

```json
{
  "name": "Buoy",
  "color": "#2f6feb",
  "base": "/buoy/docs/",
  "site": "https://mindmelding.vercel.app",
  "tabs": [
    { "label": "Product", "groups": [{ "group": "Get started", "pages": ["what-is", "quickstart"] }] }
  ]
}
```

Every field is in the [config reference](https://mindmelding.vercel.app/docs-kit/docs/reference/config/).

## What a build gives you

- One page per Markdown file, at a clean URL under your base path
- Search that runs in the browser from a small index, with no server or account
- `llms.txt`, `llms-full.txt` and a `.md` twin of every page
- A sitemap, canonical links and a 404 page
- A failed build, naming the file, when a page is missing or an internal link is broken

## Why not a hosted docs platform

Hosted platforms look good and charge for it, usually per seat or once you want your own domain. docs-kit keeps the reading experience and the docs-next-to-code workflow, and leaves out the account. It is deliberately small: three dependencies (markdown-it, its container plugin, and Shiki for code colors) and no framework.

It doesn't do versioned docs, translations or an API playground yet.

## Contributing

```bash
npm install
npm test          # node --test
npm run dev       # the docs-kit docs themselves, at localhost:4321
```

Issues and pull requests are welcome. MIT licensed.
