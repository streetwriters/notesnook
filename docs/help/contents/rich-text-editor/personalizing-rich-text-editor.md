---
title: Personalizing the editor
pageTitle: Change the font, size and line spacing in the Notesnook editor
description: Set the default font and size in the Notesnook editor, adjust line height and paragraph spacing, turn on font ligatures, and change the note title format.
keywords:
  - notesnook editor font
  - notes app line spacing
  - notesnook title format
schema: howto
---

# Personalizing text editor

Customize some common editor defaults to get a personalized editing experience.

## Default font size and font family

:::tabs key:platform
== Desktop/Web
The default font size and font family for all notes in the notes editor can be configured from `Settings > Customization > Editor`.

== Mobile

The default font size and font family for all notes in the notes editor can be configured from `Settings > Customization > Editor`.

:::

::: info
Custom fonts are not supported yet.

:::

## Line height

`{{lineHeight}}` sets how much vertical space each line of text takes in the editor. The default is `1.2` and you can set anything between `1` and `10`.

:::tabs key:platform
== Desktop/Web
Go to `{{settings}}` > `{{customization}}` > `{{editor}}` and set `{{lineHeight}}`.

== Mobile

Go to `{{settings}}` > `{{customization}}` > `{{editor}}` and tap `{{lineHeight}}`, then pick or type a value.

:::

## Font ligatures <PlanTag plan="pro" note="Web/desktop only" />

`{{fontLigatures}}` replaces common character sequences with a single symbol as you type — `->` becomes →, `<-` becomes ←, `<=` becomes ≤, `>=` becomes ≥, `!=` becomes ≠, `==>` becomes ⟹, `<==` becomes ⟸ and `--` becomes an em dash.

:::tabs key:platform
== Desktop/Web
Go to `{{settings}}` > `{{customization}}` > `{{editor}}` and turn on `{{fontLigatures}}`.

== Mobile

Font ligatures are not available in the mobile editor. Turn them on in the desktop or web app — notes you write there keep the substituted symbols everywhere, because the substitution happens once as you type.

:::

Font ligatures require a Pro plan. See [Plans & limits](/plans-and-limits).

## Default note title format in rich text editor

When you create a note in the text editor, a default title `Note $date$ $time$` is automatically set. You can change the default title format to better fit your needs.

Go to `{{settings}}` > `{{customization}}` > `{{editor}}` > `{{titleFormat}}` to customize the title formatting.

### Supported formatting templates

**$date$**: Today's date

**$day$**: Today's day name

**$time$**: The current time

**$count$**: Current note count + 1

**$timestamp$**: Full date & time without any spaces or symbols (e.g. 202305261253)

**$timestampz$**: UTC offset added to _timestamp_

You can use a combination of above templates in the note title. For example `Note $count$ - $date$` will become `Note 150 - 06-22-2023`.

**$headline$**: Up to first 60 characters of the note's first paragraph or heading. This will keep updating the title as headline of the note changes until you manually edit the title. This shouldn't be used in combination with other templates.

## Paragraph spacing

By default when you press enter on a line in the text editor, a new paragraph is created with double spacing. You can go to `{{settings}}` > `{{customization}}` > `{{editor}}` to turn off `{{doubleSpacedLines}}`.

## Related pages

- [Editor toolbar](/rich-text-editor/rich-text-editor-toolbar) — every formatting tool
- [Markdown shortcuts](/rich-text-editor/markdown-notes-editing) — formatting as you type
- [Customizing the app](/customizing-notesnook) — home screen, sidebar, sorting and formats
- [Spell checker](/desktop-integration/spell-checker) — dictionaries and languages
