---
title: Docs for agents
description: llms.txt, Markdown twins and copy-page, so AI tools read your docs without scraping HTML.
---

More of your readers are AI agents working for a person. docs-kit gives them the same content in the format they read best.

## What the build publishes

| File | What's in it |
|---|---|
| `llms.txt` | Your product's name and description, then every page as a link with its description, grouped by tab. It follows the [llms.txt proposal](https://llmstxt.org). |
| `llms-full.txt` | Every page's Markdown in one file, in sidebar order. |
| `<page>.md` | Each page's Markdown, next to its HTML. `/quickstart/` has `/quickstart.md`. |

## On every page

- **Copy page** puts the page's Markdown on your clipboard, ready to paste into a chat.
- **View as Markdown** opens the Markdown twin.

## Writing for both readers

What helps an agent helps a person skimming. Give every page a description that says what the page answers. Keep one task per page. Put commands in code blocks, not in prose, so they come through exactly.
