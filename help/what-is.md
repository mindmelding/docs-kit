---
title: What is docs-kit
description: A small tool that turns a folder of Markdown into a docs site people and agents can read.
---

docs-kit builds a docs site from a folder of Markdown files and one config file. You get tabs, a sidebar, a table of contents, search, light and dark themes, and a plain-text copy of every page for AI agents. The output is static HTML, so it runs on any host with no server.

## Why it exists

Every product needs docs, and the good hosted tools charge per seat or per site once you need a custom domain. docs-kit keeps the layout people know from the best developer docs and drops the bill. It also keeps the docs in the same repo as the product, so a pull request can change the code and the page that explains it together.

## What it does

- **Reads plain Markdown.** Four extra blocks cover callouts, cards, steps and tabs. Everything else is standard Markdown that reads fine on GitHub.
- **Builds a full site.** Top tabs, a grouped sidebar, a table of contents that follows your scroll, previous and next links, and a 404 page.
- **Searches without a server.** The build writes a small index, and search runs in the browser. Press ⌘K or `/` on any page.
- **Serves agents too.** Every page has a Markdown twin, and the site publishes `llms.txt` and `llms-full.txt`.
- **Fails loudly.** A page missing from disk or a broken internal link stops the build, so it never reaches readers.

## Who it's for

Small teams and solo builders who want docs that look finished without running a docs platform. It suits product docs, help centers and API guides. It doesn't do versioned docs or translations yet.

## Where to start

::::cards
:::card[Quickstart](/quickstart)
A working docs site on your machine in two minutes.
:::
:::card[Writing pages](/pages)
Front matter, links, images and the sidebar.
:::
:::card[Blocks](/blocks)
Callouts, cards, steps and tabs.
:::
:::card[Deploying](/deploy)
Put the site on the web under your own path.
:::
::::
