---
title: Publish a new theme
pageTitle: How do I publish a Notesnook theme?
description: Submit your Notesnook theme to the official themes repository through a GitHub pull request, and push updates to it afterwards.
keywords:
  - publish notesnook theme
  - notesnook themes repository
  - share notesnook theme
schema: howto
---

# Publish a new theme

## What you need

1. A [GitHub](https://github.com/) account
2. JSON file containing your theme (you can export the JSON file [using the Theme Builder](/custom-themes/create-a-theme-with-theme-builder))

## Publish your theme

1. Go to [https://github.com/streetwriters/notesnook-themes](https://github.com/streetwriters/notesnook-themes) and "Fork" the repo. (Don't forget to "Star" it as well!)\
   ![The Fork button on the notesnook-themes repository on GitHub](/publish-theme-1.png)
2. Click the "Create fork" button on the next page.\
   ![The Create fork page on GitHub](/publish-theme-2.png)
3. Once your fork has been created, go to the `themes/` directory and create a new file.\
   ![The themes directory in the forked repository, with the Add file button](/publish-theme-3.png)
4. Enter the path for your file as `{your-theme-id}/v1/theme.json`. (Pressing `/` will create a new directory.)\
   ![Typing the theme file path so GitHub creates the nested directories](/publish-theme-4.png)
5. Paste the contents of the JSON theme file and click "Commit changes".
   ![The theme JSON pasted into the new file, with the Commit changes button](/publish-theme-5.png)
6. Enter title of your commit as "add {your-theme-id} theme"
7. Click "Commit changes"
   ![The commit message dialog with the add theme message filled in](/publish-theme-6.png)
8. On the next page, click "Contribute" and then click "Open pull request" from the popup.
   ![The Contribute menu on the fork, with Open pull request](/publish-theme-7.png)
9. Click "Create pull request"
   ![The Create pull request button on the comparison page](/publish-theme-8.png)
10. Click "Create pull request"
    ![The pull request form, ready to submit](/publish-theme-9.png)
11. And you are all done!
    ![The submitted pull request for the new theme](/publish-theme-10.png)

## Update a published theme

Once your theme is published, you will probably need to push a new update for your theme to fix a color or change something. You can do this by [selecting your theme as the starter theme](/custom-themes/create-a-theme-with-theme-builder#1-select-a-starter-theme) in the Theme Builder and making the changes. Once everything is ready, [export the changed theme](/custom-themes/create-a-theme-with-theme-builder#5-exporting-your-theme) as usual.

::: warning
Don't forget to increment the version of your theme; otherwise, no one will be able to see the changes.

:::

To publish the updated theme, you will need to submit a new pull request in the same way as you did while publishing:

1. Go to your fork on GitHub.
2. Click "Sync fork" and then click the "Update branch" button.
   ![The Sync fork button on the forked repository](/update-theme-1.png)
3. Go to `themes/your-theme-id/v1` directory and open the `theme.json` file.
4. Click the Edit button\
   ![The Edit button on an existing theme.json file](/update-theme-2.png)
5. Paste your updated theme and click "Commit changes".
6. Enter title of your commit as `update {your-theme-id} theme` and click "Commit changes".
   ![The commit message dialog with the update theme message filled in](/update-theme-3.png)
7. Now go to the homepage of your fork and click "Contribute" and then click "Open pull request" in the popup.
   ![The Contribute menu on the fork, with Open pull request](/update-theme-4.png)
8. Click "Create pull request"
   ![The Create pull request button for the theme update](/update-theme-5.png)
9. You are all done!
   ![The submitted pull request for the theme update](/update-theme-6.png)

## Related pages

- [Theme Builder](/custom-themes/create-a-theme-with-theme-builder) — building a theme visually
- [How themes work](/custom-themes/introduction) — scopes, variants and colors
- [Using themes](/custom-themes/using-themes) — light, dark and the theme store
