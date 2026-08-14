---
title: Attachments & files
pageTitle: How do I attach files and images to a note in Notesnook?
description: Attach images and files to your notes, read PDFs without downloading them, see the per-plan size and storage limits, and manage every attachment.
keywords:
  - notesnook attach file to note
  - notesnook attachment size limit
  - notesnook attachment manager
  - notesnook orphaned attachments
  - notesnook pdf preview
schema: howto
---

# How do I attach files and images to a note in Notesnook?

Open the insert menu in the editor and pick `{{image}}` or `{{attachment}}`. The file is encrypted on your device before it is uploaded, so nobody — including us — can read it. Attaching files requires a Notesnook account, and how large a file can be depends on your plan.

::: info You need an account to attach files
Trying to insert an attachment while logged out shows `{{notLoggedIn}}` with the message `Login to upload attachments.` Attachments are stored on Notesnook's servers in encrypted form, which is why an account is required. See [why login is needed to upload attachments](/faqs/login-to-upload-attachments).

:::

## Attach a file or an image

:::tabs key:platform
== Desktop/Web

1. Put the cursor where the file should go.
2. Open the insert menu (the `+` button on the toolbar).
3. Choose `{{attachment}}` for any file, or `{{image}}` → `{{uploadFromDisk}}` for a picture.
4. Pick one or more files.

Shortcuts: `Ctrl/Cmd + Shift + A` for an attachment, `Ctrl/Cmd + Shift + I` for an image. You can also drag files straight into the editor.

== Mobile

1. Put the cursor where the file should go.
2. Open the insert menu (the `+` button on the toolbar).
3. Choose `{{attachment}}` for any file, or `{{image}}` for a picture.
4. Under `{{image}}` you also get `{{takePhotoUsingCamera}}`, which is mobile only.

:::

Notesnook hashes each file first, so attaching the same file twice reuses the copy that is already uploaded instead of consuming your storage again.

## File size and storage limits

|                   | Free  | Essential | Pro   | Believer |
| ----------------- | ----- | --------- | ----- | -------- |
| Maximum file size | 10 MB | 100 MB    | 1 GB  | 5 GB     |
| Storage per month | 50 MB | 1 GB      | 10 GB | 25 GB    |

Storage counts **attachments only** — images, files, audio and web clips. Your notes never count against it. If a file is over your plan's limit, the upload is refused with a message telling you the size you are allowed. Full details are on [Plans & limits](/plans-and-limits).

### Upload images at full quality <PlanTag plan="pro" />

By default Notesnook compresses images before uploading. The `{{imageCompression}}` setting offers `{{askEveryTime}}`, `{{enableRecommended}}` and `{{disable}}` — and `{{disable}}`, which uploads at full quality, needs **Pro** or **Believer**.

:::tabs key:platform
== Desktop/Web
Go to `{{settings}}` → `{{behaviour}}` → `{{imageCompression}}`.

== Mobile

Go to `{{settings}}` → `{{customization}}` → `{{behavior}}` → `{{imageCompression}}`.

:::

## Manage your attachments

The attachment manager lists every file in your account with its name, upload status, size and upload date.

:::tabs key:platform
== Desktop/Web
Go to `{{settings}}` → `{{profile}}` → `{{attachments}}` and press `{{open}}`.

== Mobile

Go to `{{settings}}` → `{{account}}` → `{{manageAccount}}` → `{{manageAttachments}}`.

:::

### Filter and search

Both apps group attachments by type. On desktop and web the sidebar has `All files`, `Images`, `Documents`, `Videos`, `Audios`, `{{uploads}}` and `{{orphaned}}`, each with a count. Mobile shows `All files`, `Images`, `Audios`, `Videos`, `Documents`, `{{orphaned}}` and `Errors`.

- **`{{uploads}}`** — files that are still waiting to be uploaded.
- **`{{orphaned}}`** — files that are no longer referenced by any note, usually left behind by a note you deleted. These are safe to delete once you are sure you don't want the file itself.

The search box at the top filters the list by filename. On desktop and web you can also sort by clicking the `{{name}}`, `{{size}}` or `{{dateUploaded}}` column headers.

### Act on an attachment

Open an attachment's menu — right click desktop and web, tap the item on mobile — for:

| Action                                           | What it does                                                                  |
| ------------------------------------------------ | ----------------------------------------------------------------------------- |
| `{{previewAttachment}}`                          | Opens images and PDFs without downloading them (desktop and web)              |
| `{{linkedNotes}}`                                | Lists the notes that use this file; picking one opens it                      |
| `{{fileCheck}}`                                  | Verifies the uploaded file is intact and decryptable                          |
| `{{rename}}`                                     | Changes the filename                                                          |
| `Download`                                       | Saves the file to your device                                                 |
| `Reupload`                                       | Replaces a broken upload — you must pick the same file, the hash has to match |
| `{{deletePermanently}}` (`{{delete}}` on mobile) | Removes the file from your account and from the notes that use it             |

`Download`, `{{fileCheck}}` and `{{delete}}` also work on a multi-selection from the toolbar at the top of the desktop and web list.

::: tip Fix a failed attachment
A file that shows an error usually needs `{{fileCheck}}` first. If the check reports a problem, `Reupload` with the original file repairs it.

:::

<!-- TODO: screenshot — the attachment manager with the type sidebar and the toolbar actions -->

### Download every attachment

The download button at the bottom of the desktop and web sidebar is `{{downloadAllAttachments}}`; on mobile it is the download icon in the header. A progress ring appears while it runs, and pressing the button again cancels it. This is the quickest way to get a local copy of everything you have uploaded.

### Clear the cache

`{{clearCache}}` removes the local copies of files without touching what is on the server. The confirmation spells out what happens: downloaded images and files are **cleared**, pending uploads are **cleared**, and uploaded images and files are **unaffected**.

:::tabs key:platform
== Desktop/Web
Use the `{{clearCache}}` button at the bottom of the attachment manager's sidebar.

== Mobile

Go to `{{settings}}` → `{{account}}` → `{{manageAccount}}` → `{{clearCache}}`. The setting shows the current cache size.

:::

::: warning Pending uploads are cleared too
Anything that has not finished uploading is lost when you clear the cache. Let uploads finish first.

:::

## Read a PDF without downloading it

PDFs open in a viewer inside Notesnook, so you can read one without saving it to your device first. The file is downloaded to the local cache, decrypted in memory and shown — it is never handed to another app unless you ask for that.

To open one, click or tap the PDF attachment where it sits in the note. On desktop and web there is a second route: open the file's menu in the [attachment manager](#manage-your-attachments) and choose `{{previewAttachment}}`. That entry appears only on images and PDFs, and the attachment manager on mobile has no preview action — go through the note instead.

:::tabs key:platform
== Desktop/Web

The PDF opens in a **side pane to the right of the editor**, so you can read it and write at the same time. Drag the divider between the two to resize them.

The pane's toolbar has:

| Control                | What it does                                                    |
| ---------------------- | --------------------------------------------------------------- |
| `{{search}}`           | Searches the text of the PDF and highlights the matches         |
| `{{goToPreviousPage}}` | Back one page                                                   |
| Page number            | Shows the current page and the total; type a number to jump     |
| `{{goToNextPage}}`     | Forward one page                                                |
| `{{zoomOut}}` / `{{zoomIn}}` | Steps the zoom down or up; the current percentage sits between them |
| `Download`             | Saves the PDF to your device                                    |
| `{{enterFullScreen}}`  | Hands the whole screen to the PDF                               |
| `{{close}}`            | Closes the pane and returns the space to the editor             |

The table of contents and the note properties share this space, so opening the PDF preview closes whichever of those was open.

== Mobile

The PDF opens **full screen** over the app. In its header you get:

- a back arrow to close the viewer and return to the note;
- the current page number with the page total beside it — tap the number, type a page and confirm to jump straight to it;
- a download button to save the file to your device;
- an open-in-new button that hands the PDF to another app on your phone, so you can read it in your usual PDF reader or share it onward.

Scroll and pinch to zoom as you would in any other viewer.

:::

::: info Password-protected PDFs
A PDF with a password on it opens on a `{{pdfLocked}}` screen instead of the document. Enter the PDF's own password to read it. This is the password whoever made the file set on it — it has nothing to do with your Notesnook account password or your [vault](/lock-notes-with-private-vault) password, and Notesnook cannot recover it for you.

:::

## Deleting an attachment

Deleting an attachment removes it from your account **and** from every note that references it — attachments are not moved to [Trash](/trash) the way notes are.

## What is an orphaned attachment?

Deleting a note does not delete the files it contained — they stay in your account as **orphaned** attachments, listed under `{{orphaned}}` in the attachment manager. Delete the ones you no longer want the file for.

## Why is my storage still full after I deleted attachments?

Your plan's storage figure is a **monthly allowance**, not a measure of how much you are currently storing — that is why every plan is written as `50 MB/mo`, `1 GB/mo` and so on. Uploading a file spends part of that month's allowance, and deleting the file afterwards does not hand the allowance back. The allowance starts again at the beginning of the next month.

So deleting attachments is worth doing to keep your account tidy, but it is not the way to get more room this month. If you are hitting the ceiling regularly, a plan with a larger monthly allowance is the fix — see [plans & limits](/plans-and-limits).

<GetNotesnook action="pricing" title="Need more room for files?" text="The free plan gives you 50 MB a month and a 10 MB file size cap. Paid plans go up to 25 GB a month with 5 GB files — and every file stays end-to-end encrypted on all of them." />

## Related pages

- [Plans & limits](/plans-and-limits) — the storage and file size limits for every plan
- [Trash](/trash) — why deleted notes leave their files behind
- [How is my data encrypted?](/how-is-my-data-encrypted) — how attachments are encrypted before upload
- [Private vault](/lock-notes-with-private-vault) — locking the notes your files live in
- [Backup and restore](/backup-and-restore-notes-in-notesnook) — including attachments in a backup
- [Why do I need to log in to upload attachments?](/faqs/login-to-upload-attachments)
