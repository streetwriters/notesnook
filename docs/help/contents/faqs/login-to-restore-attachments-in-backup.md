---
title: Login to restore attachments
pageTitle: Why do I need to log in to restore attachments from a backup?
description: A backup's attachments are encrypted with a key tied to your account, so Notesnook needs you signed in to decrypt them and re-upload them after a restore.
keywords:
  - notesnook restore attachments backup
  - notesnook backup attachments login
schema: faq
faqs:
  - q: Why do I need to log in to restore attachments from a backup?
    a: Attachments are encrypted with a sub-key derived from your account's data encryption key. Restoring them means decrypting them with that key and re-uploading them to your account, and neither is possible while you are signed out.
  - q: Can I restore a backup without logging in?
    a: You can restore the notes, notebooks and tags in it. The attachments in the backup cannot be restored until you sign in.
---

# Why do I need to log in to restore attachments from a backup?

Attachments are encrypted with a sub-key derived from your account's data encryption key. Restoring them means decrypting them with that key and putting them back in your account — and while you are signed out, that key isn't available and there is no account to upload to.

## What restores without an account, and what doesn't

| In the backup                                 | Restores while signed out? |
| --------------------------------------------- | -------------------------- |
| Notes, notebooks, tags, colors and reminders  | Yes                        |
| Attachments — images, files, audio, web clips | No, sign in first          |

If you restore while signed out, your notes come back but the files inside them stay unavailable until you log in and run the restore again.

::: tip Sign in before you restore
The simplest order is: log in, let the first sync finish, then restore the backup. That way notes and attachments come back in one pass.

:::

## Related pages

- [Backup and restore](/backup-and-restore-notes-in-notesnook) — creating and restoring backups
- [Attachments & files](/attachments-and-files) — managing the files in your notes
- [How is my data encrypted?](/how-is-my-data-encrypted) — the keys this page is talking about
- [Why do I need to log in to upload attachments?](/faqs/login-to-upload-attachments) — the same question, for new files
