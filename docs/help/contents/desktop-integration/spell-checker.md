---
title: Spell checker
pageTitle: Turn on the spell checker in Notesnook desktop
description: Enable the built-in spell checker in the Notesnook desktop app and choose which languages it checks against, including multiple at once.
keywords:
  - notesnook spell check
  - notes app spell checker
  - spell check languages
schema: howto
---

# Spell checker

::: info Desktop app only
Configuring the spell checker is only available in the desktop app.

:::

## Toggling the spell checker

You can enable/disable the spell checker at any time from Settings:

1. Go to `{{settings}}`
2. Click `{{editor}}`
3. Click the `{{enableSpellChecker}}` toggle to enable/disable the spell checker

## Choosing languages

::: info For macOS users
On macOS it is not possible to choose custom languages. Instead the spell checker uses your system settings.

:::

::: warning Network activity notice
Notesnook supports spell checking text in multiple languages at the same time. However, it doesn't ship all the supported languages but gives you the choice to enable the languages you want.

Selecting a new language will **download the dictionary from `dictionaries.notesnook.com`**.

:::

To select new languages:

1. Go to `{{settings}}`
2. Click `{{editor}}`
3. Click `{{languages}}`
   ![The spell checker language picker in Notesnook desktop settings](/static/spell-checker-languages.png)
4. Select the languages you need
5. Click `{{done}}` and spell checking should now be working for the languages you selected.

### My language is not included in the list

While we'd love to include all the languages, we are dependent on Electron (which, in turn, depends on Chromium) for adding the required dictionaries.

It might be possible in the future to implement a custom spell checker to support all the languages.

## Related pages

- [Personalizing the editor](/rich-text-editor/personalizing-rich-text-editor) — fonts, spacing and title formats
- [Updates & advanced](/desktop-integration/updates-and-advanced-settings) — release track, DNS and zoom
- [Customizing the app](/customizing-notesnook) — home screen, sidebar, sorting and formats
