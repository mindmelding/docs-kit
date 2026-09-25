---
title: Deploying
description: Build the site on every push and serve it under your own domain and path.
---

The build writes plain files, so any static host works. This page covers the setup mindmelding uses: each product's docs run as a Cloudflare Worker that serves static files, and the main site forwards `/<product>/docs` to it. Both are free at docs scale.

## A Worker for the docs

Add `help/wrangler.jsonc` to the product repo. docs-kit leaves this file out of the built site.

```jsonc
{
  "name": "buoy-docs",
  "compatibility_date": "2026-09-01",
  "assets": {
    "directory": "../dist-help",
    "html_handling": "auto-trailing-slash",
    "not_found_handling": "404-page"
  }
}
```

Then build and deploy once from your machine to check it:

```bash
npx github:mindmelding/docs-kit build help --out dist-help
npx wrangler deploy -c help/wrangler.jsonc
```

Wrangler prints the address, such as `https://buoy-docs.<account>.workers.dev`. The docs sit under the base path: `/buoy/docs/`.

## Deploy on every push

Connect the repo in Cloudflare once and every push to `main` rebuilds the docs. Other branches get a preview address.

::::steps
### Import the repo

In the Cloudflare dashboard, open **Workers & Pages**, choose **Create**, then import the GitHub repo. Name the Worker to match `name` in `help/wrangler.jsonc`.

### Set the commands

| Setting | Value |
|---|---|
| Build command | `npx -y github:mindmelding/docs-kit build help --out dist-help` |
| Deploy command | `npx wrangler deploy -c help/wrangler.jsonc` |
| Preview deploy command | `npx wrangler versions upload -c help/wrangler.jsonc` |

### Push

The first build takes about a minute.
::::

## Serving from your main site

To show the docs at `https://yoursite.com/buoy/docs`, have the main site forward that path to the Worker. On Vercel, add rewrites to the main site's `vercel.json`:

```json
{
  "rewrites": [
    { "source": "/buoy/docs", "destination": "https://buoy-docs.<account>.workers.dev/buoy/docs/" },
    { "source": "/buoy/docs/", "destination": "https://buoy-docs.<account>.workers.dev/buoy/docs/" },
    { "source": "/buoy/docs/:path*/", "destination": "https://buoy-docs.<account>.workers.dev/buoy/docs/:path*/" },
    { "source": "/buoy/docs/:path*", "destination": "https://buoy-docs.<account>.workers.dev/buoy/docs/:path*" }
  ]
}
```

Keep all four, in this order. The first two cover the docs home with and without a slash; the last two keep the trailing slash on pages and leave files such as `llms.txt` alone. Visitors keep seeing your domain.

:::note[Why the base path matters]
Set `base` in `help.json` to the exact path the docs live under on the main site, with slashes on both ends. If the two differ, pages load without styles.
:::

## Any other host

Upload the built folder as it is. The docs sit inside `<out>/<base>`, and `<out>/index.html` redirects to them. Serve `404.html` for missing pages if your host lets you choose.
