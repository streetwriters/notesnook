---
title: HTML formatting guide
description: Reference of HTML elements and attributes supported by the Inbox API when creating notes.
---

# HTML formatting guide for Inbox API

When sending notes through the Inbox API, the `content.type` must be `"html"` and `content.data` must be a string containing HTML. This page documents which HTML elements and attributes are supported and how to use them correctly.

> info
>
> The Inbox API only accepts `content.type: "html"`. There is currently no support for Markdown, TipTap JSON, or plain text content types.

## Headings

All heading levels `h1` through `h6` are supported.

```html
<h1>Heading 1</h1>
<h2>Heading 2</h2>
<h3>Heading 3</h3>
```

## Text formatting

| Format         | HTML                                                                |
| -------------- | ------------------------------------------------------------------- |
| Bold           | `<strong>text</strong>` or `<b>text</b>`                            |
| Italic         | `<em>text</em>` or `<i>text</i>`                                    |
| Strikethrough  | `<s>text</s>` or `<del>text</del>`                                  |
| Underline      | `<u>text</u>`                                                       |
| Inline code    | `<code>text</code>`                                                 |
| Highlight      | `<span style="background-color: rgb(255, 241, 118);">text</span>`   |
| Links          | `<a href="https://example.com">text</a>`                            |

```html
<p><strong>Bold</strong>, <em>italic</em>, <s>strikethrough</s>, <u>underline</u>, 
<code>inline code</code>, <span style="background-color: rgb(255, 241, 118);">highlight</span>, 
<a href="https://example.com">a link</a>.</p>
```

## Paragraphs and line breaks

```html
<p>A paragraph of text.</p>
<p>Another paragraph.</p>
<p>Line one<br>Line two</p>
```

## Lists

### Bullet lists

```html
<ul>
  <li>First item</li>
  <li>Second item</li>
</ul>
```

### Numbered lists

The `type` and `start` attributes are supported:

```html
<ol>
  <li>Default (numbers)</li>
</ol>

<ol type="a">
  <li>Lowercase letters</li>
</ol>

<ol type="A">
  <li>Uppercase letters</li>
</ol>

<ol type="i">
  <li>Lowercase roman numerals</li>
</ol>

<ol type="I">
  <li>Uppercase roman numerals</li>
</ol>

<ol start="5">
  <li>Starts at 5</li>
</ol>
```

### Task lists (checklists)

Use the `simple-checklist` class. Each item must be wrapped in a `<p>` tag.

```html
<ul class="simple-checklist">
  <li class="simple-checklist--item"><p>Buy groceries</p></li>
  <li class="simple-checklist--item"><p>Walk the dog</p></li>
</ul>
```

> warn
>
> Task lists **must** use `class="simple-checklist"` and `class="simple-checklist--item"`. The following do **not** work:
>
> - `<ul data-type="taskList">` / `<li data-type="taskItem" data-checked="false">` -- TipTap's own HTML serialization is not supported on ingest.
> - `<input type="checkbox">` -- Standard HTML checkboxes are not converted.
>
> If you're unsure about the exact format, export a note containing a checklist from Notesnook as HTML and inspect the markup.

## Code blocks

```html
<pre><code>const greeting = "Hello, world!";
console.log(greeting);</code></pre>
```

## Blockquotes

```html
<blockquote>
  <p>A quoted passage with <strong>rich text</strong> inside.</p>
</blockquote>
```

## Tables

```html
<table>
  <thead>
    <tr>
      <th>Name</th>
      <th>Value</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Alpha</td>
      <td>1</td>
    </tr>
    <tr>
      <td>Beta</td>
      <td>2</td>
    </tr>
  </tbody>
</table>
```

## Horizontal rule

```html
<hr>
```

## Images

```html
<img src="https://example.com/photo.jpg" alt="A photo">
```

Images inside links are also supported:

```html
<a href="https://example.com"><img src="https://example.com/photo.jpg" alt="Clickable"></a>
```

> info
>
> Images are automatically converted to attachments by the Notesnook client.

## Complete example

```html
<h1>Meeting Notes</h1>
<p><strong>Date:</strong> 2026-08-07<br><strong>Attendees:</strong> Alice, Bob</p>

<h2>Agenda</h2>
<ol type="A">
  <li>Q4 roadmap review</li>
  <li>Budget planning</li>
  <li>Team updates</li>
</ol>

<h2>Action items</h2>
<ul class="simple-checklist">
  <li class="simple-checklist--item"><p>Alice: draft Q4 proposal</p></li>
  <li class="simple-checklist--item"><p>Bob: update project timeline</p></li>
  <li class="simple-checklist--item"><p>Schedule follow-up for next week</p></li>
</ul>

<h2>Notes</h2>
<blockquote>
  <p>Budget is tight this quarter.</p>
</blockquote>

<table>
  <thead><tr><th>Item</th><th>Cost</th></tr></thead>
  <tbody>
    <tr><td>Infrastructure</td><td>$5,000</td></tr>
    <tr><td>Marketing</td><td>$3,000</td></tr>
  </tbody>
</table>
```

## Unsupported formats

These HTML constructs are known to not work with the Inbox API:

| Format | Notes |
| ------ | ----- |
| `<ul data-type="taskList">` | Use `class="simple-checklist"` instead |
| `<input type="checkbox">` | Use `class="simple-checklist"` instead |
| `<mark>` | Use `<span style="background-color: rgb(255, 241, 118);">` instead |
