---
title: Locking notes with private vault
description: Password protect your most important and sensitive notes with private vault and store them encrypted even on your device.
---

# Locking notes

Notesnook is a private notes app. All your notes are encrypted and secure by default. We can not read your notes even if we want to on our servers. However you can still add an extra layer of security and encrypt your most important and sensitive notes by adding them to a vault.

Adding notes to private vault is useful when you do not want anyone to read your notes, _even if they have access to your phone_.

## Creating a vault

:::tabs key:platform
== Desktop/Web

1. Go to Settings
2. Go to `{{vault}}` in `{{privacyAndSecurity}}` section
3. Click on `{{create}}` button
4. Enter the password for your vault (this password will be used to open all locked notes)
5. Click on `{{create}}` in the dialog to create the vault.

== Mobile

1. Go to Settings from Sidebar
2. Scroll down to `{{privacyAndSecurity}}` section
3. Tap on `{{createVault}}`
4. Enter password for the vault (this password will be used to open all locked notes)
5. Tap on `{{create}}` button to create the vault.
   :::

## Lock a note

:::tabs key:platform
== Desktop/Web

1. Right click on any note
2. Select `{{lock}}` from the context menu
3. Enter the password for the vault
4. Press `Enter` key to lock the note

== Mobile

1. Tap the ![Three dot button](/three-dot-button.png) button on a note
2. Tap on `{{lock}}` button in the note properties
3. Enter password for the vault
4. Press on `{{lock}}` to add note to vault.
   :::

::: danger Locking a note deletes its history
When a note moves into the vault, every stored [version of that note](/note-version-history) is deleted. Restore or copy anything you still need from history **before** you lock it.
:::

## Open/edit/delete a locked note

To open, edit or delete a locked note, you must provide the password for the vault to unlock it.

## Unlock a note permanently

:::tabs key:platform
== Desktop/Web

1. Right click on any note
2. Select `{{unlock}}` from the context menu
3. Enter the password for the vault in dialog.
4. Click on Unlock to remove note from vault

== Mobile

1. Tap the ![Three dot button](/three-dot-button.png) button on a note
2. Tap on `{{unlock}}` button in the note properties
3. Enter password for the vault
4. Tap on `{{unlock}}` to remove note from vault.
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

1. Go to Settings
2. Go to `{{vault}}` in `{{privacyAndSecurity}}` section
3. Click on `{{change}}` button next to `{{changeVaultPassword}}` heading
4. Enter the old and new password for the vault
5. Click on `{{changePassword}}` to update the password

== Mobile

1. Go to Settings from Sidebar.
2. Scroll down to `{{privacyAndSecurity}}` section
3. Tap on `{{vault}}`
4. Press on `{{changeVaultPassword}}`
5. Enter the old and new password for the vault
6. Click on Change to update password
   :::

## Clear vault

:::tabs key:platform
== Desktop/Web

1. Go to Settings
2. Go to `{{vault}}` in `{{privacyAndSecurity}}` section
3. Click on `{{clear}}` button next to `{{clearVault}}` heading
4. Enter your vault password and click on clear vault. All notes in the vault will be deleted.

== Mobile

1. Go to Settings from Sidebar.
2. Scroll down to `{{privacyAndSecurity}}` section
3. Tap on `{{vault}}`
4. Tap on `{{clearVault}}`
5. Enter your vault password and tap on `{{clear}}`. All notes in the vault will be deleted.
   :::

## Delete vault

In the event that you have forgotten your vault password, you can delete the vault and (optionally) delete all the notes in it.

::: danger Permanent data loss
Deleting the vault only requires your account password, but if you also choose to delete all the notes in it, those notes are permanently and irrecoverably destroyed. Because of end-to-end encryption, there is no way for Notesnook to recover a forgotten vault password or restore deleted vault notes afterwards.
:::

:::tabs key:platform
== Desktop/Web

1. Go to Settings
2. Go to `{{vault}}` in `{{privacyAndSecurity}}` section
3. Click on `{{delete}}` button next to `{{deleteVault}}` heading
4. Enter your account password and click on `{{deleteVault}}` to delete the vault

== Mobile

1. Go to Settings from Sidebar.
2. Scroll down to `{{privacyAndSecurity}}` section
3. Tap on `{{vault}}`
4. Tap on `{{deleteVault}}`
5. Enter your account password and tap on `{{delete}}` to delete the vault
   :::

## Related pages

- [App lock](/app-lock) — locking the whole app
- [How is my data encrypted?](/how-is-my-data-encrypted) — the encryption behind every note
- [Version history](/note-version-history) — going back to an earlier draft
- [Privacy mode](/privacy-mode) — blocking screenshots and screen sharing
- [Recovering your account](/recovering-your-account) — when you forget your password
