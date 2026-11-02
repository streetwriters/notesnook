---
title: Your account
pageTitle: Manage your Notesnook account — email, password, profile
description: Change your Notesnook email or password, set a profile name and picture, save your recovery key, and log out of your devices.
keywords:
  - change notesnook email
  - change notesnook password
  - notesnook recovery key
  - notesnook log out all devices
schema: howto
---

# How do I manage my Notesnook account?

Everything about your account — email, password, profile name and picture, recovery key and sessions — lives in one place: `{{settings}}` → `{{profile}}` and `{{settings}}` → `{{authentication}}` on desktop and web, or `{{settings}}` → `{{account}}` → `{{manageAccount}}` on mobile.

## Change your email address

Changing your email is a two-step flow: you confirm your password, then enter a 6-digit code sent to the **new** address.

:::tabs key:platform
== Desktop/Web

1. Go to `{{settings}}` → `{{profile}}`.
2. Press `{{changeEmail}}`.
3. Fill in `{{newEmail}}` and `{{accountPassword}}`, then press `{{next}}`.
4. Enter the `{{sixDigitCode}}` sent to your new address and press `{{next}}`.

`Resend code in …` on the code field is disabled for 60 seconds after each send.

== Mobile

1. Go to `{{settings}}` → `{{account}}` → `{{manageAccount}}`.
2. Tap `{{changeEmail}}`.
3. Fill in the new email and your account password, then tap `{{verify}}`.
4. Enter the 6-digit code sent to your new address and tap `{{changeEmail}}`.

:::

::: warning You will be logged out from all your devices
The dialog says so explicitly. Your subscription and every other setting stay as they are — only the address changes.

:::

## Change your password

:::tabs key:platform
== Desktop/Web

1. Go to `{{settings}}` → `{{authentication}}`.
2. Press `{{changePassword}}`.
3. Enter `Current password` and `{{newPassword}}`.

A backup is taken automatically before the change goes through. When it finishes you see `{{passwordChangedSuccessfully}}` and the `{{saveRecoveryKey}}` dialog opens — save the new key.

== Mobile

1. Go to `{{settings}}` → `{{account}}` → `{{manageAccount}}` → `{{changePassword}}`.
2. Enter `Current password` and `{{newPassword}}`.
3. Tap `{{changePasswordConfirm}}`.

The screen warns that changing your password logs you out from all your devices, that you should not close the app while it runs, and that you must save the new account recovery key afterwards. A backup runs automatically first.

:::

### Are my notes re-encrypted when I change my password?

**No, and that is why it is fast.** Your notes are encrypted with data keys, and those keys are what your password protects. When you change your password, Notesnook derives a new master key from the new password and re-wraps the existing keys — your attachments key, monograph passwords key, inbox keys and data encryption keys — with it. The notes themselves are never re-encrypted, so the time it takes does not grow with the size of your notes.

::: danger Your password is the only way in
Notesnook never sees your password and cannot reset it for you. If you forget it, your [account recovery key](/recovering-your-account) is the only way back to your data. Your email must be confirmed before you can change your password.

:::

## Set a profile name and picture

Your full name and profile picture are stored **end-to-end encrypted and are only visible to you** — they are personalization, not a public profile.

:::tabs key:platform
== Desktop/Web

1. Go to `{{settings}}` → `{{profile}}`.
2. Click the pencil next to `{{yourFullName}}` to open `{{editFullName}}`, type a name and confirm. You get a `{{fullNameUpdated}}` toast.
3. Hover the avatar and click `{{edit}}` to open `{{editProfilePicture}}`.

== Mobile

1. Go to `{{settings}}` → `{{account}}` → `{{manageAccount}}`.
2. `{{removeFullName}}` and `{{removeProfilePicture}}` appear here once you have set them, each asking for confirmation before clearing the value.

:::

## Save your account recovery key

The recovery key is what gets you back into your data if you forget your password. Save it before you need it.

:::tabs key:platform
== Desktop/Web

1. Go to `{{settings}}` → `{{profile}}`.
2. Press `{{save}}` next to `{{saveDataRecoveryKey}}` and confirm the `{{verifyItsYou}}` prompt.
3. In the `{{saveRecoveryKey}}` dialog use `{{saveQRCode}}` or `Download`.
4. Press `{{keyBackedUp}}` to close the dialog.

== Mobile

1. Go to `{{settings}}` → `{{account}}` → `{{manageAccount}}`.
2. Tap `{{saveDataRecoveryKey}}` and confirm your identity.
3. Save the key from the dialog that opens.

:::

The same dialog opens automatically right after you change your password, because the key changes with it.

## Log out from all other devices

:::tabs key:platform
== Desktop/Web

1. Go to `{{settings}}` → `{{profile}}`.
2. Under `{{sessions}}`, press `{{logoutAllOtherDevices}}` and confirm.

You get a `{{loggedOutAllOtherDevices}}` toast. The device you are using stays signed in.

== Mobile

This is not available in the mobile app — use the desktop or web app to force a logout on your other devices.

:::

::: info There is no list of active sessions
Notesnook does not show a per-device session list. `{{logoutAllOtherDevices}}` clears every session except the one you are on; changing your email or password logs out every device including this one.

:::

## Log out of this device

:::tabs key:platform
== Desktop/Web

1. Go to `{{settings}}` → `{{profile}}`.
2. Under `{{sessions}}`, press `{{logout}}`.
3. Leave `{{backupDataBeforeLogout}}` ticked — it is on by default — and confirm.

== Mobile

1. Go to `{{settings}}` → `{{account}}` → `{{manageAccount}}` → `{{logout}}`.
2. Leave `{{backupDataBeforeLogout}}` ticked — it is on by default — and confirm.

:::

If you have unsynced changes, the confirmation adds a warning about them before you continue. If the pre-logout backup fails, Notesnook asks whether you want to log out anyway — answering no cancels the logout so you can fix the problem first.

::: warning Logging out clears local data
Logging out resets the local database on that device. Anything that has not synced is gone, which is exactly what the backup checkbox is there to prevent. See [backup and restore](/backup-and-restore-notes-in-notesnook).

:::

## Related pages

- [Recovering your account](/recovering-your-account) — using your recovery key after a forgotten password
- [Two-factor authentication](/two-factor-authentication) — adding a second step to every login
- [Backup and restore](/backup-and-restore-notes-in-notesnook) — keeping your own copy before you log out
- [Plans & limits](/plans-and-limits) — managing your subscription and billing
- [Deleting your account](/deleting-your-account) — removing your account and data for good
- [How is my data encrypted?](/how-is-my-data-encrypted) — what your password actually protects
