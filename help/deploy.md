---
title: Deploying
description: Build the site on every push and serve it under your own domain and path.
---

The build writes plain files, so any static host works. This page covers the setup mindmelding uses: each product's docs run as a Cloudflare Worker that serves static files, on a path of the main domain, such as `mindmelding.dev/buoy/docs`. It's free at docs scale.

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
  },
  "routes": [{ "pattern": "mindmelding.dev/buoy/docs*", "zone_name": "mindmelding.dev" }]
}
```

The route puts the docs on your domain. Leave it out to use only the `workers.dev` address.

Then build and deploy once from your machine to check it:

```bash
npx github:mindmelding/docs-kit build help --out dist-help
npx wrangler deploy -c help/wrangler.jsonc
```

The docs are live at `https://mindmelding.dev/buoy/docs/`, and at the `workers.dev` address Wrangler prints.

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

## Sharing a domain with your main site

Routes let many Workers share one domain. The main site takes the whole domain, and each docs Worker takes its own path. Cloudflare sends each request to the most specific route, so `mindmelding.dev/buoy/docs/quickstart/` reaches the docs Worker and everything else reaches the site. The domain has to be on Cloudflare.

:::note[Why the base path matters]
Set `base` in `help.json` to the same path as the route, with slashes on both ends: route `mindmelding.dev/buoy/docs*` goes with base `/buoy/docs/`. If the two differ, pages load without styles.
:::

If your main site is on another host, forward the path to the Worker instead. On Vercel, that's four rewrites in `vercel.json`: `/buoy/docs` and `/buoy/docs/` to the docs home, then `/buoy/docs/:path*/` and `/buoy/docs/:path*` to the same paths on the Worker, in that order.

## Any other host

Upload the built folder as it is. The docs sit inside `<out>/<base>`, and `<out>/index.html` redirects to them. Serve `404.html` for missing pages if your host lets you choose.
