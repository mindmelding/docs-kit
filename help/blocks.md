---
title: Blocks
description: Callouts, cards, steps and tabs, in plain Markdown.
---

Blocks open with three or more colons and a name, and close with the same number of colons. A block inside another block needs fewer colons than the one around it.

## Callouts

Four kinds: `note`, `tip`, `warning` and `danger`. Add a title in square brackets, or leave it out to use the kind as the title.

```markdown
:::note
Changes take up to a minute to show.
:::

:::warning[Before you delete a workspace]
This removes every member's access at once.
:::
```

:::note
Changes take up to a minute to show.
:::

:::warning[Before you delete a workspace]
This removes every member's access at once.
:::

Use `danger` only when a reader could lose data or money.

## Cards

A grid of links. Wrap the cards in `::::cards` and give each one a title and a link.

```markdown
::::cards
:::card[Quickstart](/quickstart)
From nothing to a running site.
:::
:::card[Blocks](/blocks)
Callouts, cards, steps and tabs.
:::
::::
```

::::cards
:::card[Quickstart](/quickstart)
From nothing to a running site.
:::
:::card[Writing pages](/pages)
Front matter, links and images.
:::
::::

A card without a link renders as a plain box.

## Steps

Numbered steps for a process. Every `###` heading inside `::::steps` becomes a step.

```markdown
::::steps
### Install

Run the installer.

### Sign in

Use your work email.
::::
```

::::steps
### Install

Run the installer.

### Sign in

Use your work email.
::::

## Tabs

The same content in different forms, such as one command for each package manager.

````markdown
::::tabs
:::tab[npm]
```bash
npm install docs-kit
```
:::
:::tab[pnpm]
```bash
pnpm add docs-kit
```
:::
::::
````

::::tabs
:::tab[npm]
```bash
npm install docs-kit
```
:::
:::tab[pnpm]
```bash
pnpm add docs-kit
```
:::
::::

## Code

Fenced code blocks get syntax colors in both themes and a copy button. Name the language after the opening fence. Supported: bash, shell, json, yaml, toml, javascript, typescript, jsx, tsx, html, css, python, sql, markdown, diff, http and ini. Anything else renders as plain text.

## Tables

Standard Markdown tables. Wide tables scroll sideways on phones.

| Block | Opens with | Holds |
|---|---|---|
| Callout | `:::note` | Text |
| Cards | `::::cards` | `:::card` blocks |
| Steps | `::::steps` | `###` headings |
| Tabs | `::::tabs` | `:::tab` blocks |
