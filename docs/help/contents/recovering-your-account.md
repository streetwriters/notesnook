---
title: Recovering your account
pageTitle: I forgot my Notesnook password — how do I recover my account?
description: Recover a Notesnook account with your data recovery key or a backup file, or reset it and start over. What each option keeps, and what it costs you.
keywords:
  - notesnook forgot password
  - notesnook account recovery
  - notesnook data recovery key
  - reset notesnook account
schema: howto
---

# Recovering your account

Notesnook is one of the few end-to-end encrypted apps that lets you recover your account after forgetting your password. Which of your notes survive depends on what you have kept: your **data recovery key**, a **backup file**, or neither.

::: danger You will be logged out
For account recovery to work reliably, you will be force logged out from all your other devices. It is recommended that you save & backup all your data on your other devices before continuing.

:::

## Requesting an account recovery link

The first step to recovering your account consists of requesting an account recovery link. Notesnook sends the recovery link on your registered email. Here's how you can do that:

::: info The new login flow
The recent versions of Notesnook have updated the login flow. It is now **mandatory to verify your 2FA** before you can request an account recovery link.

:::

:::tabs key:platform
== Desktop/Web

1. Go to [Notesnook Login page](https://app.notesnook.com/login)
2. Enter your email & continue
3. Verify your 2FA & continue
4. On the next page, click `{{forgotPassword}}`

![The Forgot password link on the Notesnook login page](/static/account-recovery/step-1.png)

5. On the next page, your email should be prefilled. If it isn't, fill it out.

![The account recovery page with the email address prefilled](/static/account-recovery/step-2.png)

6. Click `{{sendRecoveryEmail}}`
7. If everything goes well, you should receive an email from Notesnook in your inbox:

![Recovery email in Notesnook](/static/account-recovery/recovery_email.png)

8. Click the `Reset your password` button in the email. This takes you to the account recovery page.

== Mobile

You can request the recovery email from the mobile app, but the recovery itself happens on the web page the email links to.

1. Open the Notesnook app and go to the login screen.
2. Enter your email and continue.
3. Verify your 2FA and continue.
4. Tap `{{forgotPassword}}` under the password field.
5. Confirm your email in the sheet that opens and send the recovery email. You should see `{{recoveryEmailSent}}`.
6. Open the email on any device and click `Reset your password` to continue in a browser.

:::

::: info What if I didn't receive an email?
_Check your spam/junk folder if you haven't received one & [contact us](mailto:support@streetwriters.co) if you still don't find it._
:::

## Choosing an account recovery method

Notesnook gives its users a variety of recovery methods depending on the data they have:

![The Choose a recovery method screen, listing the recovery key, backup file and reset options](/static/account-recovery/step-3.png)

There are three, and they are listed in order of how much you keep:

| Method                        | What it does                                                                  | Your notes                          |
| ----------------------------- | ----------------------------------------------------------------------------- | ----------------------------------- |
| `{{recoveryKeyMethod}}`       | Decrypts your data with your old key and re-encrypts it with the new password | Kept                                |
| `{{backupFileMethod}}`        | Restores your data from a `.nnbackup` file you saved earlier                  | Kept, up to the date of that backup |
| `{{clearDataAndResetMethod}}` | Wipes the account and starts it over                                          | **Deleted**                         |

### Use recovery key

This is the safest method, because it decrypts your data with your old key and then re-encrypts it with your new password. Nothing is lost.

1. Click the first option (the button that says `{{recoveryKeyMethod}}`) if you haven't already
2. Enter your recovery key in the input field & click `{{startAccountRecovery}}`
   ![The recovery key field on the account recovery page](/static/account-recovery/step-4.png)
3. Click `{{downloadBackupFile}}` once your data has been downloaded. **_Don't forget to save the file in a safe place._**
   ![The account recovery screen offering a download of your decrypted backup file](/static/account-recovery/step-5.png)
4. For next steps, see [Resetting account password](#resetting-account-password) section

### Use a backup file

If you don't have your recovery key but you do have a [backup file](/backup-and-restore-notes-in-notesnook), you can recover from that instead. You get back everything that was in the account when the backup was taken; anything written after it is not in the file and cannot be recovered.

1. Click the second option (the button that says `{{backupFileMethod}}`).
2. Select the `.nnbackup` file you saved.
3. For next steps, see the [Resetting account password](#resetting-account-password) section.

### Clear data & reset account

::: danger This deletes everything in the account
This method clears all your data — notes, notebooks, reminders, tags and attachments. It is irreversible, and because your data is end-to-end encrypted, **Notesnook cannot restore any of it afterwards.** Only use it if you have neither a recovery key nor a backup file, and you accept starting from scratch.

:::

1. Click the third option (the button that says `{{clearDataAndResetMethod}}`).
2. For next steps, see the [Resetting account password](#resetting-account-password) section.

## Resetting account password

Once you have selected the appropriate account recovery method, you'll be asked to choose a new password.

![The new password screen at the end of account recovery](/static/account-recovery/step-7.png)

1. Choose a strong & memorable password. _We recommend using a password manager like 1Password or Bitwarden so you never lose your password again._
2. Click `{{continue}}` and wait until the process finishes.
3. Save the new recovery key when prompted in a safe place.

---

That's it — your account is recovered. Log back in on your other devices to sync and read your notes again.

## Troubleshooting

### I am getting "ciphertext cannot be decrypted using this key" error during sync

This usually happens when some of your data is still encrypted with your older key. It is very rare, however.

The only way to recover from this corruption is to reset your account.

### I am getting "Sync server is not responding. Please check your internet connection..." error

The main cause of this error is our server getting timed out when clearing your data. If you have _a lot_ of data (in GBs) then you might face this.

As a workaround, try again from a laptop using Google Chrome or Mozilla Firefox. If it still fails, [contact us](mailto:support@streetwriters.co) — a very large account may need to be cleared server-side.

## Related pages

- [Account settings](/account-settings) — email, password and profile
- [Two-factor authentication](/two-factor-authentication) — a second step at login
- [How is my data encrypted?](/how-is-my-data-encrypted) — the encryption behind every note
- [Backup and restore](/backup-and-restore-notes-in-notesnook) — keeping your own encrypted copy
