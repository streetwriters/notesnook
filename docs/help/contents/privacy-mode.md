---
title: Privacy mode
pageTitle: Block screenshots and screen sharing in Notesnook
description: Privacy mode stops screenshots, screen recording and remote-desktop tools from capturing Notesnook, and hides your notes from the app switcher.
keywords:
  - block screenshots notes app
  - hide notes from screen share
  - private notes screen capture
---

# Privacy mode

Privacy mode stops other software from seeing what's on your screen while Notesnook is open — screenshots, screen recorders and remote-desktop tools get a blank window instead of your notes.

::: warning Not available on Linux
Privacy mode is not available on Linux.

:::

Privacy mode enables some OS specific settings to enhance your privacy while working in Notesnook. This includes:

1. Disable screen capture
2. Disabling window previews

:::tabs key:platform
== Desktop

1. Go to `{{settings}}`
2. Open `{{privacyAndSecurity}}`
3. Click `{{privacy}}`
4. Click toggle next to `{{privacyMode}}` to enable/disable privacy mode.

== Mobile

1. Go to `{{settings}}`
2. Open `{{privacyAndSecurity}}`
3. Tap `{{privacyMode}}` to enable/disable it

:::

::: info
Privacy mode prevents screen capturing software from capturing Notesnook. That includes tools like TeamViewer, AnyDesk and RustDesk.

On Android, it'll also show a blank screen in the Activity Switcher & taking a screenshot will show an error.

:::

## Hide note titles from your window title

Separately from privacy mode, the desktop and web apps can keep the open note's title out of the browser tab and the window title bar, so a note called "Divorce lawyer" doesn't appear in a screen share or on a projector.

:::tabs key:platform
== Desktop/Web

1. Go to `{{settings}}`.
2. Open `{{privacyAndSecurity}}` > `{{privacy}}`.
3. Turn on `{{hideNoteTitle}}`.

== Mobile

Mobile hides note content from the app switcher as part of privacy mode above; there is no separate title setting.

:::

## Related pages

- [App lock](/app-lock) — require a PIN, password or biometrics to open Notesnook
- [Private vault](/lock-notes-with-private-vault) — encrypt individual notes behind a second password
- [How is my data encrypted?](/how-is-my-data-encrypted) — what protects your notes in transit and at rest
