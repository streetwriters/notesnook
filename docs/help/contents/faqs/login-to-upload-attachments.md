---
title: Login to upload attachments
pageTitle: Why do I need to log in to upload attachments?
description: Attachments are encrypted with a key derived from your account's encryption key, so Notesnook needs you signed in before it can encrypt and upload a file.
keywords:
  - notesnook login to upload attachments
  - notesnook attachment requires account
schema: faq
faqs:
  - q: Why do I need to log in to upload attachments in Notesnook?
    a: Attachments are encrypted with a sub-key derived from your account's data encryption key. That key only exists once you are logged in, so while you are signed out there is nothing to encrypt the file with and no account to sync it to.
  - q: Can I use Notesnook without an account?
    a: Yes. Notes, notebooks, tags, the editor and search all work fully offline with no account. Attachments are the one exception, because they are stored on Notesnook's servers in encrypted form.
---

# Why do I need to log in to upload attachments?

Attachments are encrypted with a sub-key derived from your account's data encryption key. That key is created with your account and only exists once you are logged in, so while you are signed out there is nothing to encrypt the file with — and no account to sync it to.

This is why the editor shows `Login to upload attachments.` instead of inserting the file.

## What still works without an account

Everything that lives on your device: notes, notebooks, tags, colors, the [editor](/rich-text-editor/rich-text-editor-toolbar) and search all work fully offline with no account at all. Attachments are the one exception, because they are stored on Notesnook's servers in encrypted form rather than only on your device.

## What counts as an attachment

Images, files, audio recordings and [web clips](/web-clipper/clipping-your-first-web-page-with-web-clipper) all go through the same pipeline, so all of them need you signed in. See [attachments and files](/attachments-and-files) for the size and storage limits on each plan.

## Related pages

- [Attachments & files](/attachments-and-files) — managing the files in your notes
- [How is my data encrypted?](/how-is-my-data-encrypted) — the keys this page is talking about
- [Plans & limits](/plans-and-limits) — file size and storage limits on each plan
- [Why do I need to log in to restore attachments?](/faqs/login-to-restore-attachments-in-backup) — the same question, for backups
