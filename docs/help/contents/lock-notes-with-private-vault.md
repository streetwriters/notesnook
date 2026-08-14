---
title: Locking notes with private vault
pageTitle: How do I password protect a note in Notesnook?
description: Lock individual notes behind a second password with the Notesnook private vault, unlock with biometrics, and change or clear the vault.
keywords:
  - password protect notes
  - notesnook vault
  - lock a note
  - private notes app
schema: howto
---

# Locking notes

Notesnook is a private notes app: every note is encrypted by default, and nobody here can read your notes on our servers even if we wanted to. However you can still add an extra layer of security and encrypt your most important and sensitive notes by adding them to a vault.

Adding notes to private vault is useful when you do not want anyone to read your notes, _even if they have access to your phone_.

## Creating a vault

:::tabs key:platform
== Desktop/Web

1. Go to `{{settings}}`.
2. Go to `{{vault}}` in `{{privacyAndSecurity}}` section
3. Click `{{create}}` button
4. Enter the password for your vault (this password will be used to open all locked notes)
5. Click `{{create}}` in the dialog to create the vault.

== Mobile

1. Go to `{{settings}}`.
2. Open `{{privacyAndSecurity}}`
3. Tap `{{createVault}}`
4. Enter password for the vault (this password will be used to open all locked notes)
5. Tap `{{create}}` button to create the vault.

:::

## Lock a note

:::tabs key:platform
== Desktop/Web

1. Right click any note
2. Select `{{lock}}` from the context menu
3. Enter the password for the vault
4. Press `Enter` key to lock the note

== Mobile

1. Tap the ![Three dot button](/three-dot-button.png) button on a note
2. Tap `{{lock}}` button in the note properties
3. Enter password for the vault
4. Tap `{{lock}}` to add note to vault.

:::

::: danger Locking a note deletes its history
When a note moves into the vault, every stored [version of that note](/note-version-history) is deleted. Restore or copy anything you still need from history **before** you lock it.

:::

## Open/edit/delete a locked note

To open, edit or delete a locked note, you must provide the password for the vault to unlock it.

## Unlock a note permanently

:::tabs key:platform
== Desktop/Web

1. Right click any note
2. Click `{{lock}}` again — while a note is locked, a checkmark shows next to it
3. Enter the password for the vault in dialog.
4. Click `{{unlock}}` to remove note from vault

== Mobile

1. Tap the ![Three dot button](/three-dot-button.png) button on a note
2. Tap `{{unlock}}` button in the note properties
3. Enter password for the vault
4. Tap `{{unlock}}` to remove note from vault.

:::

## How long the vault stays unlocked

Once you enter your vault password, the vault stays unlocked for a while so you aren't retyping it for every note. You choose how long.

:::tabs key:platform
== Desktop/Web

1. Go to `{{settings}}`.
2. Open `{{vault}}`.
3. Set `{{lockVaultAfter}}` to `1`, `5`, `10`, `15`, `30`, `45` minutes, `1 hour` or `Never`.

== Mobile

1. Go to `{{settings}}`.
2. Open `{{privacyAndSecurity}}` > `{{vault}}`.
3. Set `{{lockVaultAfter}}`.

:::

`{{never}}` keeps the vault open until you close the app or lock it yourself. The setting only appears once a vault exists.

## Unlock with biometrics

On mobile you can open locked notes with your fingerprint or face instead of typing the vault password. Turn on `{{biometricUnlock}}` in `{{settings}}` > `{{privacyAndSecurity}}` > `{{vault}}` — you unlock with your password once, and it is then stored in the device's own secure keystore, tied to that device. The toggle only appears if the device has biometrics available.

::: warning Biometrics are per device
Turning biometrics on doesn't replace your vault password, and it doesn't travel with your account. On a new device you'll be asked for the password again — so don't rely on biometrics as your only copy of it.

:::

## Change vault password

:::tabs key:platform
== Desktop/Web

1. Go to `{{settings}}`.
2. Go to `{{vault}}` in `{{privacyAndSecurity}}` section
3. Click `{{change}}` button next to `{{changeVaultPassword}}` heading
4. Enter the old and new password for the vault
5. Click `{{changePassword}}` to update the password

== Mobile

1. Go to `{{settings}}`.
2. Open `{{privacyAndSecurity}}`
3. Tap `{{vault}}`
4. Tap `{{changeVaultPassword}}`
5. Enter the old and new password for the vault
6. Tap `{{change}}` to update the password

:::

## Clear vault

:::tabs key:platform
== Desktop/Web

1. Go to `{{settings}}`.
2. Go to `{{vault}}` in `{{privacyAndSecurity}}` section
3. Click `{{clear}}` button next to `{{clearVault}}` heading
4. Enter your vault password and click clear vault. All notes in the vault will be deleted.

== Mobile

1. Go to `{{settings}}`.
2. Open `{{privacyAndSecurity}}`
3. Tap `{{vault}}`
4. Tap `{{clearVault}}`
5. Enter your vault password and tap `{{clear}}`. All notes in the vault will be deleted.

:::

## Delete vault

In the event that you have forgotten your vault password, you can delete the vault and (optionally) delete all the notes in it.

::: danger Permanent data loss
Deleting the vault only requires your account password, but if you also choose to delete all the notes in it, those notes are permanently and irrecoverably destroyed. Because of end-to-end encryption, there is no way for Notesnook to recover a forgotten vault password or restore deleted vault notes afterwards.

:::

:::tabs key:platform
== Desktop/Web

1. Go to `{{settings}}`.
2. Go to `{{vault}}` in `{{privacyAndSecurity}}` section
3. Click `{{delete}}` button next to `{{deleteVault}}` heading
4. Enter your account password and click `{{deleteVault}}` to delete the vault

== Mobile

1. Go to `{{settings}}`.
2. Open `{{privacyAndSecurity}}`
3. Tap `{{vault}}`
4. Tap `{{deleteVault}}`
5. Enter your account password and tap `{{delete}}` to delete the vault

:::

## Related pages

- [App lock](/app-lock) — locking the whole app
- [How is my data encrypted?](/how-is-my-data-encrypted) — the encryption behind every note
- [Version history](/note-version-history) — going back to an earlier draft
- [Privacy mode](/privacy-mode) — blocking screenshots and screen sharing
- [Recovering your account](/recovering-your-account) — when you forget your password
