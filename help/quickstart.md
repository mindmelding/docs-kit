---
title: Quickstart
description: A working docs site on your machine in two minutes.
---

You need Node.js 20 or newer. By the end you'll have a `help/` folder in your repo and the site running at `localhost:4321`.

::::steps
### Start a docs folder

Run this from the root of your repo:

```bash
npx github:mindmelding/docs-kit init help
```

It writes `help/help.json` and two starter pages, `what-is.md` and `quickstart.md`.

### Name it

Open `help/help.json` and set `name`, `description`, `color` and `base`. `base` is the path the docs will live under, such as `/buoy/docs/`. See [the config reference](/reference/config) for every field.

### Run it

```bash
npx github:mindmelding/docs-kit dev help
```

Open the address it prints. The page reloads each time you save a file.

### Build it

```bash
npx github:mindmelding/docs-kit build help --out dist
```

The site lands in `dist/`, inside a folder that matches `base`. Upload that folder anywhere that serves static files.
::::

:::tip
Add the build to `package.json` so nobody has to remember the flags: `"docs": "docs-kit build help"`.
:::
