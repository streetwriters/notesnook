---
layout: home
title: Notesnook Help
description: Your complete and free resource to using Notesnook as a daily note taking app to organize your work and life while safeguarding your privacy.

hero:
  name: Notesnook Help
  tagline: Helping you discover everything you can do with Notesnook
  image:
    src: /logo.png
    alt: Notesnook
  actions:
    - theme: brand
      text: Go to docs
      link: /docs
    - theme: alt
      text: Create your first note
      link: /create-a-note-in-notesnook
    - theme: alt
      text: Download Notesnook
      link: https://notesnook.com/downloads

features:
  - title: Organize your notes
    details: Notebooks, tags, colors, favorites, pins and the side menu — pick the structure that fits your work.
    link: /organizing-notes/organize-notes-using-notebooks
    linkText: Start with notebooks
  - title: Write and format
    details: The editor toolbar, markdown shortcuts, tables and task lists, on every platform.
    link: /rich-text-editor/rich-text-editor-toolbar
    linkText: Open the editor guide
  - title: Bring your notes over
    details: Import from Evernote, Google Keep, Obsidian, Joplin, Simplenote and plain markdown or HTML files.
    link: /importing-notes/
    linkText: Import your notes
  - title: Keep your notes safe
    details: Backups, restore, the private vault, app lock and how your data is encrypted end-to-end.
    link: /backup-and-restore-notes-in-notesnook
    linkText: Back up your notes
  - title: Recover your account
    details: What to do when you forget your password, and what your recovery key protects.
    link: /recovering-your-account
    linkText: Recover an account
  - title: Publish with Monographs
    details: Share a note as a link — optionally encrypted with a password only your reader knows.
    link: /publish-notes-with-monographs
    linkText: Publish a note
---

<div class="vp-doc nn-home-note">

Notesnook is a free and open source note taking app focused on user privacy and ease of use. Everything is encrypted on your device with `XChaCha20-Poly1305` and `Argon2` before it ever leaves it — which also means nobody at Notesnook can read your notes, or recover them for you.

Can't find what you're looking for? [Contact us](https://notesnook.com/contact-us) or [open an issue](https://github.com/streetwriters/notesnook/issues/new/choose).

</div>

<style>
.nn-home-note {
  max-width: 768px;
  margin: 64px auto 0;
  padding: 32px 24px 72px;
  border-top: 1px solid var(--vp-c-divider);
  color: var(--vp-c-text-2);
}

@media (max-width: 640px) {
  .nn-home-note {
    margin-top: 40px;
    padding-bottom: 56px;
  }
}
</style>
