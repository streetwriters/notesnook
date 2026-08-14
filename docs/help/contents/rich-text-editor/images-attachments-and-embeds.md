---
title: Images & embeds
pageTitle: Add images, files, audio and embeds to a note in Notesnook
description: Insert images from disk, camera or a URL, resize and align them, attach any file, play audio attachments, preview PDFs, and embed a video or a post in a note.
keywords:
  - notesnook insert image
  - notesnook attachments
  - embed youtube in notes
  - notesnook web clip
---

# Add images, files and embeds to a note

Notes aren't only text. You can drop an image into a note, attach a file of any type, play back an audio recording, preview a PDF beside what you're writing, and embed a video or a post from the web. Everything you attach is encrypted before it leaves your device.

::: info You need an account to attach anything
Attachments are uploaded to your encrypted storage, so Notesnook asks you to log in the first time you try to add one — the message reads `{{notLoggedIn}}` on desktop and web, and `{{loginRequired}}` on mobile. Storage and maximum file size depend on your plan; see [plans & limits](/plans-and-limits).

:::

<!-- TODO: screenshot — a note containing an image, a file attachment and an embedded video -->

## Insert an image

:::tabs key:platform
== Desktop/Web

1. Put the cursor where the image should go.
2. Click the ![Toolbar plus](/toolbar-plus.png) button in the toolbar and choose `{{image}}`.
3. Pick `{{uploadFromDisk}}` (or press `Ctrl+Shift+I`) and select one or more image files, or pick `{{attachImageFromURL}}` and paste a link.
4. The `{{attachingFiles}}` dialog shows each file's progress; the image appears in the note when it's done.

Two shortcuts skip the menu entirely:

- **Drag and drop** — drag image files from your file manager straight onto the editor.
- **Paste** — paste an image from your clipboard. If the clipboard holds text _and_ a file, Notesnook pastes the text.

== Mobile

1. Tap where the image should go.
2. Tap the `+` button in the toolbar at the bottom of the screen and choose `{{image}}`.
3. Choose `{{uploadFromDisk}}` to pick from your gallery, `{{takePhotoUsingCamera}}` to shoot one now, or `{{attachImageFromURL}}` to paste a link.
4. Confirm in the sheet that appears; the image is encrypted and inserted into the note.

:::

::: info Images from a URL are downloaded, not hot-linked
When you use `{{attachImageFromURL}}`, Notesnook downloads the image and stores it as one of your attachments. The note never asks the original website for the file, so opening the note doesn't tell that site anything about you.

:::

## Keep images at full quality <PlanTag plan="pro" />

Images are compressed before upload by default, which keeps them small and fast to sync. Turning compression **off** — uploading the original, uncompressed file — is a Pro feature.

:::tabs key:platform
== Desktop/Web
When the `{{attachingFiles}}` dialog is set to ask, each image has a `{{compress}}` toggle. Turn it off for full quality, then click `{{insert}}`.

To change what happens by default, go to `{{settings}}` > `{{customization}}` > `{{behaviour}}` > `{{imageCompression}}` and choose `{{askEveryTime}}`, `{{enableRecommended}}` or `{{disable}}`.

== Mobile

The sheet shown when you attach an image has a `Compress (recommended)` checkbox. Clear it for full quality.

To change the default, go to `{{settings}}` > `{{customization}}` > `{{behavior}}` > `{{imageCompression}}`.

:::

On a plan that doesn't support full quality images, the option is greyed out. Attempting to change it will ask you to upgrade your plan.

## Resize and align an image

1. Click (or tap) the image to select it.
2. Drag the handle in its **bottom-right corner**. The aspect ratio is locked, so the image never distorts, and it can't be dragged wider than the editor.
3. For exact numbers, open `{{imageProperties}}` from the image's toolbar and type a `width` or a `height` — the other value follows automatically.

Alignment lives in the same toolbar, as three buttons: `{{alignLeft}}`, the centering button (its tooltip reads `{{alignCenter}}`) and `{{alignRight}}`.

:::tabs key:platform
== Desktop/Web
Selecting an image floats a small toolbar above it with `{{previewAttachment}}`, `{{downloadAttachment}}`, the three alignment buttons and `{{imageProperties}}`.

== Mobile

Selecting an image adds an `{{imageSettings}}` button to the toolbar at the bottom. Tap it for `{{downloadAttachment}}`, alignment and `{{imageProperties}}`. `{{previewAttachment}}` is available directly in the toolbar.

:::

## Attach any other file

1. Put the cursor where the attachment should go.
2. Open the ![Toolbar plus](/toolbar-plus.png) menu and choose `{{attachment}}` — on desktop and web the shortcut is `Ctrl+Shift+A`.
3. Select the file. It's encrypted on your device and uploaded to your storage.

The attachment appears in the note as a block with its filename and size. Select it for `{{downloadAttachment}}`, and `{{previewAttachment}}` where the file type supports it. Dragging files onto the editor works for any file type, not only images.

## Play an audio attachment

Audio attachments render as a player with the filename, the file size and standard playback controls. Press play and Notesnook fetches and decrypts the audio before it starts — there's a short pause the first time. Selecting the player gives you `{{downloadAttachment}}` and, in an editable note, the option to remove it.

## Preview an image or a PDF

Select the attachment and choose `{{previewAttachment}}`.

:::tabs key:platform
== Desktop/Web
Images open in a viewer. **PDFs open in a preview pane beside the editor**, so you can read the document and take notes on it at the same time. Drag the divider to resize the pane, and close it when you're done. See [tabs & panes](/rich-text-editor/editor-tabs-and-panes).

== Mobile

Images open in a full-screen image viewer and PDFs open in a full-screen PDF viewer.

:::

## Embed a video or a post

1. Open the ![Toolbar plus](/toolbar-plus.png) menu and choose `{{embed}}`.
2. Use the `{{fromURL}}` tab and paste the address, setting `width` and `height` if you want, **or** use the `{{fromCode}}` tab and paste an embed snippet — the snippet has to contain an `iframe` with a `src`, and any width and height in it are used.
3. Click `{{save}}`.

Notesnook converts common sharing URLs into their embeddable form for you, so a normal YouTube link works. YouTube embeds are loaded through a Notesnook proxy so the video service can't profile you from your note, and a link to X (formerly Twitter) is rendered as an embedded post rather than a bare frame. Embed code that tries to run `javascript:` is rejected.

Select an embed to resize it with the bottom-right handle — embeds resize freely, without a locked aspect ratio — to align it left, center or right, or to open `{{embedProperties}}` and edit its source and exact size. On mobile the same buttons are grouped under `{{embedSettings}}` in the toolbar.

::: warning Embeds load content from the internet
An embed is a live frame from another website, so opening a note that contains one makes a request to that site. Everything else in your note stays end-to-end encrypted; see [how your data is encrypted](/how-is-my-data-encrypted).

:::

## Read a web clip inside a note

Pages saved with the [Notesnook Web Clipper](/web-clipper/clipping-your-first-web-page-with-web-clipper) appear in the note as a self-contained clip with the page title in its header. Select it for:

- `{{fullscreen}}` — expand the clip to fill the screen; press `Esc` to come back
- `{{openLink}}` — open the saved copy of the page
- `{{openSource}}` — open the original page the clip came from

On mobile these live under `{{webclipSettings}}` in the toolbar, which offers `{{fullscreen}}` and `{{openSource}}`.

## Related pages

- [Editor toolbar](/rich-text-editor/rich-text-editor-toolbar) — every formatting tool and how to customize the toolbar
- [Attachments and files](/attachments-and-files) — managing, downloading and cleaning up everything you've attached
- [Plans & limits](/plans-and-limits) — storage, maximum file size and full-quality images
- [Clipping your first web page](/web-clipper/clipping-your-first-web-page-with-web-clipper) — how clips get into a note
- [Tabs & panes](/rich-text-editor/editor-tabs-and-panes) — the PDF preview pane beside the editor
