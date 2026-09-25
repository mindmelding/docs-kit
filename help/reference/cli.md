---
title: Command line
description: The build, dev and init commands and their options.
---

Run docs-kit with `npx github:mindmelding/docs-kit <command>`, or install it and use `docs-kit <command>`.

## Commands

| Command | What it does |
|---|---|
| `init [dir]` | Starts a docs folder (default `help`) with `help.json` and two pages. Leaves an existing folder alone. |
| `dev [dir]` | Builds, serves the site at `localhost:4321`, and rebuilds and reloads on every save. |
| `build [dir]` | Builds the site into `dist/`. Exits with an error on a missing page or a broken link. |

## Options

| Option | Default | What it does |
|---|---|---|
| `--out <dir>` | `dist` | Where the build goes. The folder is emptied first. |
| `--base <path>` | `help.json` `base`, or `/` | The URL path the docs live under. |
| `--site <url>` | `help.json` `site` | Origin for canonical links, `llms.txt` and the sitemap. |
| `--port <n>` | `4321` | Port for `dev`. |

## What a build writes

```
dist/
  index.html          redirects to the base path
  <base>/
    index.html        the docs home (or a redirect to the first page)
    <page>/index.html one folder per page
    <page>.md         each page's Markdown
    search.json       the search index
    llms.txt
    llms-full.txt
    sitemap.xml       when site is set
    404.html
    _kit/             styles and scripts, fingerprinted
```
