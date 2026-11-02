---
title: Using themes
pageTitle: How do I change the theme in Notesnook?
description: Switch between light and dark mode, install a theme from the Notesnook theme store, set separate light and dark themes, or load a theme from a file.
keywords:
  - notesnook dark mode
  - notesnook themes
  - change notesnook theme
  - notesnook theme store
schema: howto
---

# How do I change the theme in Notesnook?

Notesnook keeps two themes at once — one for light mode and one for dark mode — and switches between them based on your color scheme. You can pick both from the built-in theme store, or load a theme from a `theme.json` file.

## Switch between light and dark

:::tabs key:platform
== Desktop/Web

1. Go to `{{settings}}`.
2. Open `{{customization}}` → `{{appearance}}`.
3. Under `{{themes}}`, set `{{colorScheme}}` to `{{light}}`, `{{dark}}` or `{{auto}}`.

`{{auto}}` follows your operating system, so Notesnook flips with it.

== Mobile

1. Go to `{{settings}}`.
2. Open `{{customization}}` → `{{appearance}}`.
3. Turn on `{{useSystemTheme}}` to follow your phone's light/dark setting, or turn it off and use the `{{darkMode}}` switch to choose yourself.

:::

::: tip Faster switching on desktop
The side menu profile menu has a `{{toggleDarkLightMode}}` item, so you don't have to open settings.

:::

## Install a theme from the theme store

Every theme in the store is fetched from `themes-api.notesnook.com` and installed on your device. The list only shows themes that are compatible with the version of Notesnook you're running.

:::tabs key:platform
== Desktop/Web

1. Go to `{{settings}}` → `{{customization}}` → `{{appearance}}`.
2. Scroll to `{{selectTheme}}`.
3. Type in the `{{searchThemes}}` box to search, or use the `{{all}}`, `{{dark}}` and `{{light}}` filters to narrow the list.
4. Click a theme to see its details, then confirm — or hover it and click `{{setAsDarkTheme}}` / `{{setAsLightTheme}}` directly.

A checkmark marks the themes you currently have applied.

== Mobile

1. Go to `{{settings}}` → `{{customization}}` → `{{appearance}}`.
2. Tap `{{themes}}`.
3. Use the search box or the `{{all}}`, `{{dark}}` and `{{light}}` filters.
4. Tap a theme to open its details, then tap `{{setAsDarkTheme}}` or `{{setAsLightTheme}}`.

An applied theme reads `{{appliedDark}}` or `{{appliedLight}}` on its details screen.

:::

<!-- TODO: screenshot — the theme store with the All/Dark/Light filters and a theme card -->

## Set separate light and dark themes

There is no separate "which theme goes where" setting — a theme's own color scheme decides it. Applying a dark theme replaces your dark theme; applying a light theme replaces your light theme. Your `{{colorScheme}}` setting then decides which of the two you see.

So to have both: install a light theme, install a dark theme, and set `{{colorScheme}}` to `{{auto}}` (or `{{useSystemTheme}}` on mobile).

## Load a theme from a file

If you have a `theme.json` file — one you built with the [Theme Builder](/custom-themes/create-a-theme-with-theme-builder), or one that isn't published yet — you can apply it directly.

1. Open the theme list as above.
2. Click or tap `{{loadFromFile}}`.
3. Pick the `.json` file. Notesnook validates it and shows the theme's details.
4. Confirm to apply it.

If the file is missing required fields or isn't a valid theme, the app tells you instead of applying it. Full steps and caveats are on [install a theme from file](/custom-themes/install-a-theme-from-file).

## Where do the themes come from?

The theme store is an open collection. Themes are submitted as JSON files to the [notesnook-themes](https://github.com/streetwriters/notesnook-themes) repository, and once merged they appear in the store for everyone. If you have made a theme you like, you can [publish it](/custom-themes/publish-a-theme) the same way.

## Related pages

- [Publish a theme](/custom-themes/publish-a-theme) — get your theme into the store
- [Create a theme with the Theme Builder](/custom-themes/create-a-theme-with-theme-builder) — build one without writing JSON
- [Install a theme from file](/custom-themes/install-a-theme-from-file) — apply a `theme.json` directly
- [Theme engine introduction](/custom-themes/introduction) — how scopes, variants and colors fit together
- [Customizing the app](/customizing-notesnook) — home screen, side menu and list density
