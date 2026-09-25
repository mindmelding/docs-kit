---
title: help.json
description: Every field in the config file.
---

`help.json` sits at the root of your docs folder. Only `name` and `tabs` are required.

```json
{
  "name": "Buoy",
  "description": "An AI employee for small service businesses.",
  "color": "#2f6feb",
  "colorDark": "#6d9bff",
  "base": "/buoy/docs/",
  "site": "https://mindmelding.vercel.app",
  "home": "/buoy",
  "repo": "mindmelding/buoy-app",
  "logo": { "light": "images/logo.svg", "dark": "images/logo-dark.svg" },
  "favicon": "images/favicon.svg",
  "links": [{ "label": "Back to Buoy", "href": "/buoy" }],
  "tabs": [
    {
      "label": "Product",
      "groups": [{ "group": "Get started", "pages": ["what-is", "quickstart"] }]
    }
  ]
}
```

## Fields

| Field | Required | What it does |
|---|---|---|
| `name` | Yes | Product name. Shown in the top bar and page titles. |
| `tabs` | Yes | The top tabs. Each has a `label` and `groups`; each group has an optional `group` title and a list of `pages`. |
| `description` | No | One sentence. Opens `llms.txt`. |
| `color` | No | Accent color for links, the active tab and highlights. Default `#3a6df0`. |
| `colorDark` | No | Accent color in dark mode. Defaults to `color`. |
| `base` | No | The URL path the docs live under, such as `/buoy/docs/`. Default `/`. The `--base` flag overrides it. |
| `site` | No | Your site's origin, with no trailing slash. Used for canonical links, `llms.txt` and `sitemap.xml`. |
| `home` | No | Where the logo links. Defaults to the first page. |
| `repo` | No | `owner/name` on GitHub. Adds an "Edit this page" link. |
| `branch` | No | Branch for "Edit this page". Default `main`. |
| `dir` | No | Docs folder inside the repo, for "Edit this page". Default `help`. |
| `logo` | No | A path, or `{ "light": …, "dark": … }`. Paths are relative to the docs folder. Without a logo, the name is shown as text. |
| `favicon` | No | Path to the tab icon. |
| `links` | No | Extra links on the right of the top bar, each `{ "label", "href" }`. Hidden on phones. |
| `lang` | No | The page language. Default `en`. |
