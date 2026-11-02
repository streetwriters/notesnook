---
title: Introduction
pageTitle: How Notesnook themes work — scopes, variants and colors
description: "How the Notesnook theme engine is built: the 11 scopes that split up the app, the 6 variants inside each one, and the 13 colors each variant defines."
keywords:
  - notesnook theme spec
  - notesnook theme scopes
  - custom theme notes app
---

# Introduction

::: info
This document reflects v1.0 of the Notesnook Theme specification.

:::

The goal of this document is to provide you with an exact idea of what each scope, variant & color in the theme does, how they all fit together, and how you can use them to create your own custom theme for Notesnook. This document will also serve as a descriptive guide for any `theme.json` file you may find online.

## What is a theme?

Even though Notesnook's theming engine is quite flexible, there _are_ limits to it. In Notesnook, a theme is like a skin: while you can change the colors of it, there's no way to change other properties like size & layout. In other words, your theme will only affect the colors of UI elements like background color, text color, border color and so on.

But the question is, how granular can you get? Notesnook already had accent colors which allowed switching between 9 different "themes". Is that the extent of customization allowed by the new theming engine or is there more? What are the possibilities?

Suffice it to say, you can change every part of Notesnook independently. This is made possible with the help of 3 things.

### 1. Scopes

Scopes allow you to independently theme various parts of the Notesnook app.
Each scope represents a specific part of the app. For example, you can style the editor toolbar differently from the rest of the UI. Since scopes never overlap with each other, you can style each part of Notesnook without worrying about the rest.

Here's a quick schematic diagram of each scope used by the Notesnook Web app.

![A diagram of the Notesnook web app with each theme scope outlined and labelled](/custom-themes/theme-scopes-schema.png)

Currently, Notesnook has 11 scopes:

#### 1. `base`

The `base` scope is the only required scope in a Notesnook theme. It must have all its variants & colors specified. `base` scope acts as the fallback for all other scopes. For example, if a Notesnook client cannot find a color in the `statusBar` scope, it'll automatically take it from the `base` scope.

Here's an incomplete list of areas that always use the `base` scope:

1. Web clipper
2. Login/sign up screens
3. Email confirmation screen
4. Settings (on mobile)

This allows you to change only the colors you need without any duplication.

#### 2. `navigationMenu`

The `navigationMenu` scope is used by the left-most side bar that contains the links to your Notes, Notebooks, Favorites etc.

![The Notesnook side bar, the area covered by the navigationMenu scope](/custom-themes/theme-scope-navigation-menu.png)

#### 3. `titleBar`

The `titleBar` scope is used by the title bar Notesnook draws along the top of the desktop window. It has no effect when you have switched to [your system's native titlebar](/desktop-integration/updates-and-advanced-settings).

#### 4. `statusBar`

The `statusBar` scope is used by the bottom most horizontal bar that contains your email address, the sync status etc.

![The bar along the bottom of the desktop window, the area covered by the statusBar scope](/custom-themes/theme-scope-status-bar.png)

#### 5. `list`

The `list` scope is used by the list of notes, notebooks & everything else that is in the middle pane.

![The middle pane listing notes, the area covered by the list scope](/custom-themes/theme-scope-list.png)

#### 6. `editor`

The `editor` scope is used by the editor and everything inside of it like task lists, outline lists, tables etc. This scope does not include the editor toolbar.

![The note editing surface, the area covered by the editor scope](/custom-themes/theme-scope-editor.png)

#### 7. `editorToolbar`

The `editorToolbar` scope is used specifically by the editor toolbar for styling all its icons, buttons & menus.

![The formatting toolbar above the editor, the area covered by the editorToolbar scope](/custom-themes/theme-scope-editor-toolbar.png)

#### 8. `editorSidebar`

The `editorSidebar` scope is used by the right-most properties menu, and the PDF attachments preview.

![The note properties pane on the right, the area covered by the editorSidebar scope](/custom-themes/theme-scope-editor-sidebar.png)

#### 9. `dialog`

All the dialogs in the app, regardless of how they are triggered or what they contain, use the `dialog` scope. This includes the settings dialog, notebook creation dialog, reminder creation dialog etc.

![A Notesnook dialog, the area covered by the dialog scope](/custom-themes/theme-scope-dialog.png)

#### 10. `contextMenu`

All the context menus & drop down menus in the app use the `contextMenu` scope. This includes the menus in the `editor`, `list`, and other scopes.

![A right click menu in Notesnook, the area covered by the contextMenu scope](/custom-themes/theme-scope-context-menu.png)

#### 11. `sheet`

The `sheet` scope is a mobile specific scope, and is not used by the web app. It is used by all the popup action sheets displayed in the mobile app.

![A bottom sheet in the Notesnook mobile app, the area covered by the sheet scope](/custom-themes/theme-scope-sheet.png)

---

Each scope is further broken down into Variants.

### 2. Variants

Variants reflect either the state or importance of a UI element. Variants are NOT isolated and can be intermixed so it is important for a theme to have good contrast between the colors of each variant in order to avoid making some parts of Notesnook completely unreadable.

Currently, Notesnook has 6 variants:

1. `primary`
   \
   The `primary` variant is used by every element when it isn't in any of the other states.
2. `secondary`
   \
   The `secondary` variant is complementary to the `primary` variant. It is used in places to show elements or text of less importance. For example, the text `12h ago` shown under each note item uses the `paragraph` color from the `secondary` variant.
3. `disabled`
   \
   The `disabled` variant is used for elements that are present but not currently actionable — a greyed-out button, or a tool the editor has switched off for the current selection.
4. `selected`
   \
   This variant is used throughout the app for all elements in selected, toggled, or focused state.
5. `error`
   \
   The `error` variant contains colors for showing errored status anywhere inside the app. It is possible that the UI element using this variant may make use of colors from other variants.
6. `success`
   \
   The `success` variant contains colors for showing success status anywhere inside the app. It is possible that the UI element using this variant may make use of colors from other variants.

Each variant further contains a total of 13 colors. The **Transparent** column shows which ones accept an alpha channel (`#dbdbdb99`) as well as plain hex:

| Color              | Description                                                                                                        | Transparent |
| ------------------ | ------------------------------------------------------------------------------------------------------------------ | ----------- |
| `accent`           | Color used to make something stand out (like the primary button in dialogs). Can be both background or foreground. | ❌          |
| `accentForeground` | Color for icons & text on accent background                                                                        | ❌          |
| `background`       | Background color of elements                                                                                       | ✅          |
| `paragraph`        | Color of paragraphs and other text                                                                                 | ❌          |
| `heading`          | Color of headings &amp; titles                                                                                     | ❌          |
| `backdrop`         | The color of the overlay shown behind dialogs &amp; modals                                                         | ✅          |
| `hover`            | Background color when hovering over elements (that support it)                                                     | ✅          |
| `border`           | Border color                                                                                                       | ❌          |
| `separator`        | Color of the separator line between items                                                                          | ❌          |
| `placeholder`      | Color of the placeholder in input fields                                                                           | ✅          |
| `icon`             | Color of icons                                                                                                     | ❌          |
| `shade`            | Tint laid over an element to shade it, usually derived from the accent color                                       | ✅          |
| `textSelection`    | Background color of selected text                                                                                  | ✅          |

### Theme Metadata

1. `name`: the name of the theme
2. `description`: a short description of the theme
3. `id`: a unique alphanumeric id of the theme. Must be unique across all other themes.
4. `version`: version of the theme (you must increment this on every new change of the theme)
5. `authors`: one or more authors of the theme.
6. `compatibilityVersion`: The compatibility version of the theme used by the client to decide whether the theme is supported by the current client version.
7. `license`: the license under which the theme can be shared, modified etc.
8. `homepage`: website or homepage of the theme
9. `colorScheme`: "light" or "dark"
10. `tags`: keywords to help categorize the theme & improve search results.

## Further reading

- [Build your own theme using the Theme Builder](/custom-themes/create-a-theme-with-theme-builder).

## Related pages

- [Using themes](/custom-themes/using-themes) — light, dark and the theme store
- [Theme Builder](/custom-themes/create-a-theme-with-theme-builder) — building a theme visually
- [Publish a theme](/custom-themes/publish-a-theme) — sharing a theme with everyone
- [Customizing the app](/customizing-notesnook) — home screen, sidebar, sorting and formats
