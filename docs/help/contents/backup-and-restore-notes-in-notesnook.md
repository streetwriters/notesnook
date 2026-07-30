---
title: Backup and restore
description: Notesnook allows you to backup all your notes data to a single backup file. Learn how you can backup your notes and restore them.
---

# Backup your notes

It is always a good practice to take regular backups of your data so you can easily recover your data in case of data corruption or losing access to your account. All backups are stored locally encrypted (unless you turn off backup encryption) on your device.

::: danger Store your password & recovery key safely
Since all your data is end-to-end encrypted, we have no way to restore your account data if you forget your account password and lose your account recovery key. That's why we recommend that you store your password & recovery key in a password manager or some other safe place.
:::

::::tabs key:platform
== Desktop/Web

1. Go to `{{settings}}`.
2. Open `{{backupExport}}` section
3. Click `Create backup` under `{{backupNow}}` heading to create a new `.nnbackupz` file

![Create backup web in Notesnook](/create-backup-web.png)
== Mobile

1. Go to `{{settings}}`.
2. Open `{{backupRestore}}`
3. Tap `{{backups}}`
4. Tap `{{backupNow}}` to create a new `.nnbackupz` file

::: info
On **Android** when you take a backup for the first time, you will be asked to select a folder where you want to store all your backup files. You can always change your backup files location from `Backups > Select backup directory`.

Regardless of the folder you select, Notesnook will create a folder "Notesnook/backups" inside it and store all backup files there.
:::
::::

## Automatic Backups

For maximum safety against potential data loss, you can enable daily, weekly or monthly backups of your notes. Enabling automatic backups will ensure that all your data is safely backed up locally after a regular interval.

::::tabs key:platform
== Desktop

1. Go to `{{settings}}`.
2. Open `{{backupExport}}` section
3. Select the Automatic backups interval from the dropdown

![Auto backups desktop in Notesnook](/auto-backups-desktop.png)
== Web
::: info
On the **web** app there is no way to automatically save backups to a folder, that is why Notesnook only reminds the users when it's time to create a new backup.
:::

1. Go to `{{settings}}`.
2. Open `{{backupExport}}` section
3. Select the Backup reminders interval from the dropdown

![Auto backups web in Notesnook](/auto-backups-web.png)
== Mobile

1. Go to Settings > Backup & Restore
2. Tap Backups
3. Select automatic backup frequency to enable automatic backups
   ::::

## Encrypted Backups (Recommended)

To keep your backups secure & private, it is recommended that you enable encryption on your backup files instead of storing them as plaintext data. **Starting from v2.6.0, encrypted backups are enabled by default for all users.**

:::tabs key:platform
== Desktop/Web

1. Go to `{{settings}}`.
2. Open `{{backupExport}}` section
3. Click the toggle next to `{{backupEncryption}}` to enable/disable encrypted backups

== Mobile

1. Go to `{{settings}}` > `Backup & Restore`
2. Tap `{{backups}}`
3. Tap the toggle next to `{{backupEncryption}}` to enable/disable encrypted backups
   :::

::: info
Backups are always encrypted with your account password.
:::

# Restore a backup

::: danger Restoring overwrites what you have now
Restoring a backup replaces your current content in-place. Anything that changed since that backup was taken is reverted to how it was in the backup. Entirely new content — notes you created after the backup — is not touched.

**Always create a backup before restoring one.**
:::

### Recovering a few old notes without losing today's work

If you only want something back from an old backup, don't restore it over your current data and hope for the best. Sandwich it:

1. Create a **new backup** of your current data.
2. Restore the **old backup** and take out what you needed.
3. Restore the **new backup** from step 1 to put everything back as it was.

That sequence means no recent change is lost. Be aware of one side effect: restoring an old backup can bring back notes you had deleted since, so check your trash and notes list afterwards.

At any point in time, you can restore a backup to recover lost data. Backups created on one account can be restored on another Notesnook account.

:::tabs key:platform
== Desktop/Web

1. Go to `{{settings}}`.
2. Open `{{backupExport}}` section
3. Click `{{restore}}` button next to `{{restoreBackup}}` heading
4. Select the `.nnbackupz` or `.nnbackup` file from your PC that you want to restore.

== Mobile

1. Go to `{{settings}}`.
2. Open `Backup & Restore`
3. Tap `{{restoreBackup}}`
4. From `{{restoreBackup}}` sheet, select the backup you want to restore. If your backup file is located in some other location, tap `{{restoreFromFiles}}` on top right corner of the sheet then select the backup file.

<img src="/restore-backup-mobile.png" height="700px">
:::

## Related pages

- [Exporting notes](/export-notes-from-notesnook) — taking your notes to another app
- [Recovering your account](/recovering-your-account) — when you forget your password
- [Attachments & files](/attachments-and-files) — managing the files in your notes
- [Version history](/note-version-history) — going back to an earlier draft
- [Plans & limits](/plans-and-limits) — what each plan unlocks and the exact limits
