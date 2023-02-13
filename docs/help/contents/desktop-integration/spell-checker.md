# Spell checker

> error Desktop app only
>
> Configuring the spell checker is only available in the desktop app.

## Toggling the spell checker

You can enable/disable the spell checker at any time from Settings:

1. Go to `Settings`
2. Click on `Editor Settings`
3. Click on the `Enable spellchecker` toggle to enable/disable the spell checker

## Choosing languages

> info For macOS users
>
> On macOS it is not possible to choose custom languages. Instead the spell checker uses your system settings.

> warn Network activity notice
>
> Notesnook supports spell checking text in multiple languages at the same time. However, it doesn't ship all the supported languages but gives you the choice to enable the languages you want.
>
> Selecting a new language will **download the dictionary from `dictionaries.notesnook.com`**.

To select new languages:

1. Go to `Settings`
2. Click on `Editor Settings`
3. Click on `Spellchecker languages`
   ![Spell checker languages dialog](/static/spell-checker-languages.png)
4. Select the languages you need
5. Click on `Done` and spell checking should now be working for the languages you selected.

### My language is not included in the list

While we'd love to include all the languages, we are dependent on Electron (which, in turn, depend on Chromium) for adding the required dictionaries.

It might be possible in the future to implement a custom spell checker to support all the languages.
