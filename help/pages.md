---
title: Writing pages
description: Front matter, links, images and how pages get into the sidebar.
---

A page is a Markdown file in your docs folder. It shows up on the site once `help.json` lists it.

## Front matter

Start each page with a title and a one-line description:

```markdown
---
title: Connect Slack
description: Send alerts to a channel your team already reads.
---
```

The title becomes the page heading and the sidebar label. The description shows under the heading, in search results, in `llms.txt` and in link previews. Leave out the `# Heading` line; docs-kit writes it from the title.

## Adding a page to the sidebar

List the file name without `.md` in a group in `help.json`. Pages in folders use the folder path.

```json
{
  "label": "Guide",
  "groups": [
    { "group": "Get started", "pages": ["what-is", "quickstart"] },
    { "group": "Integrations", "pages": ["integrations/slack", "integrations/email"] }
  ]
}
```

The order in `help.json` is the order in the sidebar and in the previous and next links. A file that isn't listed doesn't get built.

## Headings

Use `##` for sections and `###` for subsections. Both appear in the table of contents on the right, and each gets a link you can share. Deeper headings still work but stay out of the table of contents.

## Links

Link to another page by its path from the docs root, starting with `/`:

```markdown
See [Connect Slack](/integrations/slack) for the setup.
```

docs-kit adds the base path, so the same link works on your laptop and in production. Links to sections work with `#`: `/quickstart#run-it`. Relative links such as `slack` or `../quickstart` work too.

:::warning[Broken links stop the build]
If a link points to a page that isn't in `help.json`, or an image that isn't in the folder, the build fails and names the file. Fix the link, or add the page.
:::

## Images

Put images anywhere in the docs folder, such as `help/images/`, and link them from the root:

```markdown
![The alerts settings screen](/images/alerts.png)
```

Write alt text that says what the image shows, for readers who can't see it and for agents.
