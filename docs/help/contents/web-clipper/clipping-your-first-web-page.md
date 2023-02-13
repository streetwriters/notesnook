# Clipping your first web page

## Connecting with the web app

Before you can clip pages, you must connect the web clipper with the Notesnook web app. The web clipper works completely offline and relies on the web app to sync & save your clips.

1. Activate the web clipper by clicking on the Notesnook icon in your browser toolbar

   > info Pin the Notesnook Web Clipper to toolbar
   >
   > Modern browsers group all extensions under their Extensions dropdown by default. It is recommended that you `Pin to toolbar` the Notesnook Web Clipper.
   >
   > # [Chrome](#/tab/chrome)
   >
   > ![How to pin the Notesnook Web Clipper to toolbar in Chrome](/static/web-clipper/chrome-pin-to-toolbar.gif)
   >
   > # [Firefox](#/tab/firefox)
   >
   > ![How to pin the Notesnook Web Clipper to toolbar in Firefox](/static/web-clipper/firefox-pin-to-toolbar.gif)
   >
   > ***

2. Click on `Connect to Notesnook`
3. Notesnook web app will open in a new tab in the background. Wait a few seconds and the web clipper should automatically connect.
   > error What to do if the web clipper doesn't connect?
   >
   > There are a few things you can do to troubleshoot:
   >
   > 1. Make sure you are logged in on the Notesnook web app
   > 2. Make sure you have the Notesnook web app opened in the background
   > 3. The web clipper doesn't yet support multiple browser windows so make sure there aren't any additional browser windows opened in the background.
   > 4. Try restarting the browser

## Selecting the clipping area

The web clipper provides a few options to help you clip exactly the part of the page you need:

![Notesnook Web Clipper clipping area options](/static/web-clipper/clipping-area.png)

### Full page

The `Full page` mode clips the web page from top to bottom including every possible detail. This mode is also the largest in size & consequently takes longer to clip.

### Article

The `Article` mode is best for blogs & articles on the web because it tries to finds the "content" part of the page using a couple of heuristics. It works similar to Firefox's Reader Mode.

### Visible area

The `Visible area` mode clips only the nodes that fit in the viewport. Any nodes that are partially in the viewport are also included.

### Selected nodes

The `Selected nodes` mode allows you to select exactly which nodes you want to clip:

1. Select the `Selected nodes` mode from the Notesnook Web Clipper
2. You should now see a small popup in the bottom-right corner of the page
   ![](/static/web-clipper/selected-nodes-popup.png)
3. Click on all the nodes you want to clip (they can be in any part of the screen).
   > info
   >
   > The web clipper stacks all the selected nodes vertically during final processing.
4. Clicking again on the selected nodes will deselect them.
5. Once you are done, click on the Clip button
6. Activate the Notesnook Web Clipper and save your clip.

## Selecting the clipping mode

The clipping mode controls how the final clip should look.

### Simplified

`Simplified` mode doesn't include any styles. It is best suited for long-form content such as articles & blogs. All clips in `Simplified` mode are saved directly as is i.e. they do not appear as web clip embeds in the Notesnook editor.

### Screenshot

> info Pro users only
>
> `Screenshot` mode is only available to Pro users

`Screenshot` mode includes all the styles + images but the final result is saved as an image i.e. it is non-interactive.

### Complete with styles

> info Pro users only
>
> `Complete with styles` mode is only available to Pro users

`Complete with styles` mode saves all images, styles & everything on the page to retain the maximum amount of information. The final result appears as an embed in the Notesnook editor which is full interactive.

![](/static/web-clipper/web-clip-embed.gif)

## Organizing your web clip

Notesnook Web Clipper offers 3 easy ways to organize your web clips (all of which are completely optional):

![](/static/web-clipper/organize-web-clip.png)

### [Append to note](#/tab/append-to-note)

You can choose to append your web clip to an existing note and it'll be automatically added at the bottom of that note:

1. Click on `Select a note to append to`
2. Select the note you want to append to

### [Add to notebook](#/tab/add-to-notebook)

> info
>
> You can only assign the web clip to an existing notebook. Creating new notebooks is not supported from inside the web clipper.

1. Click on `Select a notebook`
2. Select the notebook you want to add the web clip to

### [Assign tags](#/tab/assign-tags)

1. Click on `Assign a tag`
2. Select the tag you want to assign (you can assign multiple tags)
3. You can also create & assign a new tag by typing in the search bar
   ![](/static/web-clipper/assign-a-tag.gif)

---

## Saving your web clip

1. Click on the `Save` button to save & sync your web clip.
