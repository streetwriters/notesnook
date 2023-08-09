# Creating themes with theme builder

With Notesnook theme builder creating custom themes in Notesnook super easy and simple so that anyone, even with no technical knowledge can create compelling themes for Notesnook and share with the community.

Now let's walk you through the whole process of creating and your own theme for Notesnook.

Open the [Theme builder](https://theme-builder.notesnook.com) app in your browser.

The theme builder app is simply the regular Notesnook app embedded inside the theme-builder. On the right side you will find the theme-builder pane where we will be creating our custom theme for Notesnook.

![Toolbar](/theme-builder.png)

## Select a starter theme

Before we begin creating our theme, we will select a starter theme upon which we will be building our custom theme. This allows us to quickly build our theme and visualize the changes on the go instead of building from scratch.

To select a starter theme, we will simply go to `Settings > Appearance > Themes` and apply a theme from the list. Remember that a can only have one color scheme, light or dark so choose your starter theme accordingly.

For our example, we are going to create a Blue version of Notesnook light theme, hence we will be using Notesnook light as our starter theme.

![Toolbar](/theme-builder-select-starter-theme.png)

Once the theme is applied, the theme builder should update with all properties of Notesnook light theme

## Setting up basic theme information

Now let's will fill in the basic theme information for our theme such as the name, descripion, id, version and so on.

![Toolbar](/theme-builder-metadata.png)

Remember that the `id` for your custom theme should not conflict with other published themes on Notesnook. You can see the list of all published theme ids [here](https://github.com/streetwriters/notesnook-themes/tree/main/themes)

## Understanding theme scopes

Theme scopes allow you to independantly themeing various parts of the Notesnook app allowing greater flexibility and control over how the final theme will look. Each scope represents a specific part of the Notesnook app, for example the `navigationMenu` scope is responsible for theming the sidebar.

## Configuring base theme scope

Every Notesnook theme must implement the base theme scope. Colors from the base theme scope are used as a fallback in all other scopes when a specific color is not defined.

![Toolbar](/theme-builder-base.png)

Since we want to create a blue variant of our Notesnook light theme, we will replace the default green (#008837) in our base theme scope with blue(#1d4ed8). We have to go through all variants, primary, secondary, selected, disabled and replace the colors.

![Toolbar](/theme-builder-change-color.gif)

As you change the colors, the theme will update in the app and you can see changes in realtime.

## Configuring optional scopes

After configuring base theme scope, you can optionally set colors for other scopes such as navigation menu, context menu and so on. For example, if you look at our default light theme, the navigation menu color is grayish and not pure white as compared to other parts of the app.

![Toolbar](/theme-builder-navigation-menu.png)

These are defined in the navigation menu scope of the default Notesnook light theme

![Toolbar](/theme-builder-navigation-menu-scope.png)

In most cases, the color defined in the base scope will suffice unless you want to get super creative like me:

![Toolbar](/theme-builder-navigation-menu-modify.png)

So you can see, you are in full control of the app's look and feel and only sky is the limit to what you can do and how you can make Notesnook look!

## Exporting your theme

Once you have finished working on your theme, you can export it with the Export theme button at the top of theme builder pane. You will get a `{your-theme-id}.json` file which you can be loaded into the Notesnook app for personal use or to publish to the Notesnook app.

## Loading theme from file in Notesnook

In both mobile and desktop/web apps, you can load themes from local file system. Go to Settings > Appearance > Themes & Click on "Load from file" button and select your `theme.json` file to load the theme.

![Toolbar](/theme-load-file.png)

## How to publish

To publish your theme on Notesnook you will need a [GitHub](https://github.com) account.

1. Go to https://github.com/streetwriters/notesnook-themes and fork the repo

![Toolbar](/publish-theme-1.png)

2. Click on the "Create fork" button on the next screen.

![Toolbar](/publish-theme-2.png)

3. Once your fork has been created, go to `themes/` directory and create a new file.

![Toolbar](/publish-theme-3.png)

4. Enter the path for your file as `{your-theme-id}/v1/theme.json`.

![Toolbar](/publish-theme-4.png)

5. Paste the contents of `{your-theme-id}.json` file you exported from the theme builder earlier and click on commit changes

![Toolbar](/publish-theme-5.png)

6. Enter title of your commit as "add {your-theme-id} theme"

7. Click on commit changes

![Toolbar](/publish-theme-6.png)

8. On the next screen, click on "Contribute" and then click on "Open pull request" in the popup.

![Toolbar](/publish-theme-7.png)

9. Click on "Create pull request"

![Toolbar](/publish-theme-8.png)

10. On the next screen, click on "Create pull request" again

![Toolbar](/publish-theme-9.png)

You are all done. We will review your submission and publish it in the Notesnook app.

![Toolbar](/publish-theme-10.png)

## Managing updates

Once your theme is published in the Notesnook app, and you need to push a new update for your theme, you will load your {theme-id}.json file in the theme builder app again and make changes to your theme.

Once you have finished making changes, make sure you update the version for your theme.

Finally export it from theme builder and submit a pull request in the same way as you did while publishing.

1. Go to your fork on github, mine is at https://github.com/ammarahm-ed/notesnook-themes.

2. Click on Sync fork and then click Update branch.

![Toolbar](/update-theme-1.png)

3. Go to `themes/your-theme-id/v1`, open the theme.json file and click on the edit button

![Toolbar](/update-theme-2.png)

4. Paste your updated theme and click on Commit changes. Enter title of your commit as `update {theme-id} theme`

![Toolbar](/update-theme-3.png)

5. Now go to the homepage of your fork and click on "Contribute" and then click on "Open pull request" in the popup.

![Toolbar](/update-theme-4.png)

6. Click on "Create pull request"

![Toolbar](/update-theme-5.png)

You are all done. We will review your submission and publish it in the Notesnook app.

![Toolbar](/update-theme-6.png)
