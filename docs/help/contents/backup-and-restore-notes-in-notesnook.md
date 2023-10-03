---
title: Backup and restore
description: Notesnook allows you to backup all your notes data to a single backup file. Learn how you can backup your notes and restore them.
---

# Backup your notes

It is always a good practice to take regular backups of your data so you can easily recover your data in case of data corruption or losing access to your account. All backups are stored locally encrypted (unless you turn off backup encryption) on your device.

> error Store your password & recovery key safely
>
> Since all your data is end-to-end encrypted, we have no way to restore your account data if you forget your account password and lose your account recovery key. That's why we recommend that you store your password & recovery key in a password manager or some other safe place.

# [Desktop/Web](#/tab/web)

1. Go to Settings
2. Scroll down in the Settings navigation menu and click on `Backup & export` section
3. Click on `Create backup` under `Backup now` heading to create a new `.nnbackupz` file

![](/create-backup-web.png)

# [Mobile](#/tab/mobile)

1. Go to Settings from Sidebar
2. Scroll down to `Backup and Restore`
3. Tap on `Backups`
4. Press on `Backup now` to create a new `.nnbackupz` file

> info
>
> On **Android** when you take a backup for the first time, you will be asked to select a folder where you want to store all your backup files. You can always change your backup files location from `Backups > Select backup directory`.
>
> Regardless of the folder you select, Notesnook will create a folder "Notesnook/backups" inside it and store all backup files there.

---

## Automatic Backups

For maximum safety against potential data loss, you can enable daily, weekly or monthly backups of your notes. Enabling automatic backups will ensure that all your data is safely backed up locally after a regular interval.

# [Desktop](#/tab/desktop)

1. Go to Settings
2. Scroll down in the Settings navigation menu and click on `Backup & export` section
3. Select the Automatic backups interval from the dropdown

![](/auto-backups-desktop.png)

# [Web](#/tab/web)

> info
>
> On the **web** app there is no way to automatically save backups to a folder, that is why Notesnook only reminds the users when it's time to create a new backup.

1. Go to Settings
2. Scroll down in the Settings navigation menu and click on `Backup & export` section
3. Select the Backup reminders interval from the dropdown

![](/auto-backups-web.png)

# [Mobile](#/tab/mobile)

1. Go to Settings > Backup & Restore
2. Press Backups
3. Select automatic backup frequency to enable automatic backups

---

## Encrypted Backups (Recommended)

To keep your backups secure & private, it is recommended that you enable encryption on your backup files instead of storing them as plaintext data. **Starting from v2.6.0, encrypted backups are enabled by default for all users, free or Pro.**

# [Desktop/Web](#/tab/web)

1. Go to Settings
2. Scroll down in the Settings navigation menu and click on `Backup & export` section
3. Click on the toggle next to `Backup encryption` to enable/disable encrypted backups

# [Mobile](#/tab/mobile)

1. Go to `Settings` > `Backup & Restore`
2. Tap on `Backups`
3. Tap on the toggle next to `Backup encryption` to enable/disable encrypted backups

---

> info
>
> Backups are always encrypted with your account password.

# Restore a backup

At any point in time, you can restore a backup to recover lost data. However, **to restore a backup, you must be logged in to your Notesnook account.** Backups created on one account can be restored on another Notesnook account.

# [Desktop/Web](#/tab/web)

1. Go to Settings
2. Scroll down in the Settings navigation menu and click on `Backup & export` section
3. Click on `Restore` button next to `Restore backup` heading
4. Select the `.nnbackupz` or `.nnbackup` file from your PC that you want to restore.

# [Mobile](#/tab/mobile)

1. Go to Settings from Sidebar
2. Scroll down to `Backup & Restore` section
3. Tap on `Restore backup`
4. From `Restore backup` sheet, select the backup you want to restore. If your backup file is located in some other location, click on `Restore from files` on top right corner of the sheet then select the backup file.

<img src="/restore-backup-mobile.png" height="700px">

---
