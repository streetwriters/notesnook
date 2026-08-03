---
title: Theme Builder
pageTitle: How do I create a custom Notesnook theme?
description: Build a Notesnook theme in the Theme Builder without writing JSON — pick a starter theme, set your colors and metadata, and export it as a theme file.
keywords:
  - notesnook theme builder
  - create notesnook theme
  - custom theme notes app
schema: howto
---

# Create a theme with the Theme Builder

The Theme Builder provides an easy and accessible way to create themes for Notesnook without prior technical knowledge. The purpose of this tool is to allow anyone, especially a layman, to tweak Notesnook according to their liking.

You can access the Theme Builder at [https://theme-builder.notesnook.com](https://theme-builder.notesnook.com).

::: info
The Theme Builder is a full copy of the Notesnook web app, with an extra panel for tweaking the colors. You can use it to sign into your account, create notes, and everything else you do in the Notesnook app.

:::

Here's a look at the theme builder:

![The Notesnook Theme Builder, with the colour panel beside a live copy of the app](/theme-builder.png)

Now let's walk through the whole process of creating your own theme using the Theme Builder.

## 1. Select a starter theme

Before you can create your own theme, it is best to select a starter theme to build upon. That lets you see every change against a working app instead of building one from scratch.

The Theme Builder makes this very easy:

1. Open the [Theme Builder](https://theme-builder.notesnook.com).
2. Go to `Settings > Appearance > Themes` and select any theme from the list.

::: warning
Keep in mind that a theme can only have one color scheme: `light` or `dark` so choose your starter theme accordingly.

:::

For our example, we are going to select "Notesnook Light" as our base theme.

![Choosing Notesnook Light as the starter theme in the Theme Builder](/theme-builder-select-starter-theme.png)

Once the theme is applied, you'll notice all the colors in the Theme Builder update with the colors of the Notesnook Light theme.

## 2. Setting theme metadata

Theme metadata allows better discoverability in search and gives users a quick idea of what the theme is. You can read about all the supported properties [here](/custom-themes/introduction#theme-metadata).

![The theme metadata fields in the Theme Builder](/theme-builder-metadata.png)

::: warning Theme ID conflicts
Remember that the `id` for your custom theme should not conflict with other published themes on Notesnook. You can see the list of all published theme IDs [here](https://github.com/streetwriters/notesnook-themes/tree/main/themes).

:::

## 3. Configuring base theme scope

::: info
Before you proceed, it is recommended that you [learn about how theming in Notesnook works](/custom-themes/introduction#what-is-a-theme), what scopes, variants & colors do etc.

:::

Every Notesnook theme must implement the base theme scope. Colors from the `base` theme scope are used as a fallback in all other scopes if a specific color is not defined.

![The base theme scope expanded in the Theme Builder, showing its variants](/theme-builder-base.png)

For our example, we will be creating a Blue accented theme for Notesnook. In order to do that, we must replace all the occurrences of the default green color (#008837) in the `base` theme scope with a nice blue color (#1d4ed8).

Since we want to create a blue variant of our Notesnook light theme, we will replace the default green (#008837) in our base theme scope with blue(#1d4ed8). We have to go through all variants, primary, secondary, selected, disabled and replace the colors.

![Replacing the green accent colour with blue and seeing the app update live](/theme-builder-change-color.gif)

As you change each color, the app updates in real time.

## 4. Configuring optional scopes

After configuring `base` theme scope, you can optionally set colors for other scopes, such as `navigationMenu`, to make them look a little different.

::: info An example
For example, in the default Notesnook Light theme, the background color of the navigation menu is grayish instead of pure white.

![The Notesnook Light navigation menu, with a background slightly greyer than the rest of the app](/theme-builder-navigation-menu.png)

This is because the default Notesnook Light theme has a different background color set for the `navigationMenu` scope.

![The navigationMenu scope in the Theme Builder, showing its own background colour](/theme-builder-navigation-menu-scope.png)

:::

The sky is the limit here. In most cases, though, the `base` scope will suffice unless you want to get more adventurous.

![The navigation menu restyled with a custom background colour](/theme-builder-navigation-menu-modify.png)

And that's it! Your theme is ready to be exported.

## 5. Exporting your theme

Once you have finished working on your theme, you can export it by clicking the "Export theme" button at the top of Theme Builder pane.

![The Export theme button at the top of the Theme Builder panel](/theme-builder-export-theme.png)

You will get a JSON file containing your theme which you can either [install directly into the Notesnook app](/custom-themes/install-a-theme-from-file) for personal use or [publish it](/custom-themes/publish-a-theme) for others to use as well.

## Further reading

- [Publish your theme](/custom-themes/publish-a-theme)
- [Install a theme directly from JSON file](/custom-themes/install-a-theme-from-file)

## Related pages

- [How themes work](/custom-themes/introduction) — scopes, variants and colors
- [Publish a theme](/custom-themes/publish-a-theme) — sharing a theme with everyone
- [Install from file](/custom-themes/install-a-theme-from-file) — loading a theme.json
- [Using themes](/custom-themes/using-themes) — light, dark and the theme store
