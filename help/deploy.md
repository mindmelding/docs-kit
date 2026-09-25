---
title: Deploying
description: Build the site in CI and serve it under your own domain and path.
---

The build writes plain files, so any static host works. This page covers the setup mindmelding uses: each product's docs build on Cloudflare Pages, and the main site forwards `/<product>/docs` to them.

## Cloudflare Pages

Connect the product repo once and every push builds the docs. Pull requests get their own preview address.

::::steps
### Create the project

In the Cloudflare dashboard, open **Workers & Pages**, choose **Create**, then **Pages**, then **Connect to Git**, and pick the repo.

### Set the build

| Setting | Value |
|---|---|
| Build command | `npx -y github:mindmelding/docs-kit build help --out dist` |
| Build output directory | `dist` |
| Environment variable | `NODE_VERSION` = `22` |

### Deploy

Save. The first build takes about a minute. The docs appear at `https://<project>.pages.dev/<base>`, for example `https://buoy-docs.pages.dev/buoy/docs/`.
::::

## Serving from your main site

To show the docs at `https://yoursite.com/buoy/docs`, have the main site forward that path to the Pages project. On Vercel, add a rewrite to the main site's `vercel.json`:

```json
{
  "rewrites": [
    {
      "source": "/buoy/docs/:path*",
      "destination": "https://buoy-docs.pages.dev/buoy/docs/:path*"
    }
  ]
}
```

Visitors keep seeing your domain. Because `base` in `help.json` matches the path, every link and asset resolves the same way on both addresses.

:::note[Why the base path matters]
Set `base` to the exact path the docs live under on the main site, with slashes on both ends. If the two differ, pages load without styles.
:::

## Any other host

Upload the `dist/` folder as it is. The docs sit inside `dist/<base>`, and `dist/index.html` redirects to them. Serve `404.html` for missing pages if your host lets you choose.
