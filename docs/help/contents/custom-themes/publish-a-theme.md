# Publish a new theme

## Prerequisites

1. A [GitHub](https://github.com/) account
2. JSON file containing your theme (you can export the JSON file [using the Theme Builder](/custom-themes/create-a-theme-with-theme-builder))

## Instructions

1. Go to [https://github.com/streetwriters/notesnook-themes](https://github.com/streetwriters/notesnook-themes) and "Fork" the repo. (Don't forget to "Star" it as well!)\
   ![Toolbar](/publish-theme-1.png)
2. Click on the "Create fork" button on the next page.\
   ![Toolbar](/publish-theme-2.png)
3. Once your fork has been created, go to the `themes/` directory and create a new file.\
   ![Toolbar](/publish-theme-3.png)
4. Enter the path for your file as `{your-theme-id}/v1/theme.json`. (Pressing `/` will create a new directory.)\
   ![Toolbar](/publish-theme-4.png)
5. Paste the contents of the JSON theme file and click on "Commit changes".
   ![Toolbar](/publish-theme-5.png)
6. Enter title of your commit as "add {your-theme-id} theme"
7. Click on "Commit changes"
   ![Toolbar](/publish-theme-6.png)
8. On the next page, click on "Contribute" and then click on "Open pull request" from the popup.
   ![Toolbar](/publish-theme-7.png)
9. Click on "Create pull request"
   ![Toolbar](/publish-theme-8.png)
10. Click on "Create pull request"
    ![Toolbar](/publish-theme-9.png)
11. And you are all done!
    ![Toolbar](/publish-theme-10.png)

# Updating your theme

Once your theme is published, you will probably need to push a new update for your theme to fix a color or change something. You can do this by [selecting your theme as the starter theme](/custom-themes/create-a-theme-with-theme-builder#1-select-a-starter-theme) in the Theme Builder and making the changes. Once everything is ready, just [export the changed theme](/custom-themes/create-a-theme-with-theme-builder#5-exporting-your-theme) as usual.

> warn
>
> Don't forget to increment the version of your theme; otherwise, no one will be able to see the changes.

To publish the updated theme, you will need to submit a new pull request in the same way as you did while publishing:

1. Go to your fork on GitHub. (Mine is at [https://github.com/ammarahm-ed/notesnook-themes](https://github.com/ammarahm-ed/notesnook-themes)).
2. Click on "Sync fork" and then click the "Update branch" button.
   ![Toolbar](/update-theme-1.png)
3. Go to `themes/your-theme-id/v1` directory and open the `theme.json` file.
4. Click on the Edit button\
   ![Toolbar](/update-theme-2.png)
5. Paste your updated theme and click on "Commit changes".
6. Enter title of your commit as `update {your-theme-id} theme` and click on "Commit changes".
   ![Toolbar](/update-theme-3.png)
7. Now go to the homepage of your fork and click on "Contribute" and then click on "Open pull request" in the popup.
   ![Toolbar](/update-theme-4.png)
8. Click on "Create pull request"
   ![Toolbar](/update-theme-5.png)
9. You are all done!
   ![Toolbar](/update-theme-6.png)
