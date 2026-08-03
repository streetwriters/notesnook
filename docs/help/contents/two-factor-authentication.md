---
title: Two-factor authentication
pageTitle: How do I set up two-factor authentication in Notesnook?
description: Turn on 2FA for your Notesnook account with an authenticator app, email or SMS, add a fallback method, and save your recovery codes.
keywords:
  - notesnook two factor authentication
  - notesnook 2fa authenticator app
  - notesnook 2fa recovery codes
  - lost 2fa device notesnook
schema: howto
---

# How do I set up two-factor authentication in Notesnook?

Two-factor authentication (2FA) asks for a 6-digit code in addition to your password every time you log in. You set it up from `{{settings}}`, choose one of three methods — an authenticator app, email or SMS — and save the recovery codes Notesnook shows you at the end.

::: info 2FA protects your account, not your notes
Your notes are already end-to-end encrypted with a key derived from your password. 2FA stops someone from _logging in_ as you. It is a separate protection from [the encryption of your data.](/how-is-my-data-encrypted)

:::

## The three 2FA methods

| Method                | What it is                                                                | Plan             |
| --------------------- | ------------------------------------------------------------------------- | ---------------- |
| `{{mfaAuthAppTitle}}` | Use an authenticator app to generate 2FA codes. Marked `{{recommended}}`. | All plans        |
| `{{mfaEmailTitle}}`   | Notesnook sends a 2FA code to your account email when prompted.           | All plans        |
| `{{mfaSmsTitle}}`     | Notesnook sends an SMS with a 2FA code when prompted.                     | Pro and Believer |

An authenticator app is the recommended option because it generates codes on your device and keeps working without a network connection.

## Turn on two-factor authentication

:::tabs key:platform
== Desktop/Web

1. Go to `{{settings}}` → `{{authentication}}`.
2. Under `{{twoFactorAuth}}`, press `{{change}}` next to `{{change2faMethod}}`.
3. Confirm the `{{verifyItsYou}}` prompt with your account password.
4. Pick a method on the `{{select2faMethod}}` screen.
5. Follow the method's setup — scan the QR code, or press `{{sendCode}}` for email and SMS — and type the code into `{{enterSixDigitCode}}`.
6. Save the codes on the `{{saveRecoveryCodes}}` screen, then finish.

You should now see `{{twoFactorAuthEnabled}}`.

== Mobile

1. Go to `{{settings}}` → `{{account}}` → `{{manageAccount}}`.
2. Open `{{twoFactorAuth}}`, then tap `{{change2faMethod}}`.
3. Confirm your identity with your account password.
4. Pick a method from the list.
5. Follow the method's setup — tap `{{copy}}` for the authenticator key, or `{{sendCode}}` for email and SMS — and type the code into the 6-digit field, then tap `{{next}}`.
6. Save the codes on the `{{saveRecoveryCodes}}` screen with `{{copyCodes}}` or `{{saveToFile}}`, then tap `{{next}}`.

You should now see `{{twoFactorAuthEnabled}}`.

:::

### Set up an authenticator app

:::tabs key:platform
== Desktop/Web
Notesnook shows a QR code with the instruction `{{mfaScanQrCode}}`. If your app cannot scan it, copy the text key shown underneath instead — spaces do not matter. Your app then displays a rotating 6-digit code to enter.

== Mobile

Notesnook shows the setup key in a field with a `{{copy}}` button. Tapping it copies the key and opens your installed authenticator app directly. Your app then displays a rotating 6-digit code to enter.

:::

### Set up email

Notesnook pre-fills your account email and sends the code there when you press `{{sendCode}}`. You cannot enter a different address — email 2FA always uses your account email.

### Set up SMS <PlanTag plan="pro" />

SMS 2FA is available on **Pro** and **Believer**. Enter your phone number **with the country code** (for example `+1234567890`), press `{{sendCode}}`, and enter the code from the SMS. On free and Essential plans, selecting `{{mfaSmsTitle}}` shows an upgrade prompt instead — see [Plans & limits](/plans-and-limits).

## Wait 60 seconds between codes

For email and SMS, the `{{sendCode}}` button becomes `Resend code in …` and counts down for **60 seconds** after each send. On mobile, requesting a new code too early shows `{{resendCodeWait}}`. The countdown exists both during setup and at login.

## Add a fallback 2FA method

A fallback is a second method you can use when your primary one is unavailable — for example email as a fallback when your authenticator app is on a phone you don't have. The method you already use as primary is not offered again in the list.

:::tabs key:platform
== Desktop/Web

1. Go to `{{settings}}` → `{{authentication}}`.
2. Press `{{addFallback2faMethod}}` (it reads `{{change2faFallbackMethod}}` once one exists).
3. Confirm the `{{verifyItsYou}}` prompt.
4. Pick a method and complete the same setup steps as above.

You should now see `{{fallbackMethodEnabled}}`.

== Mobile

1. Go to `{{settings}}` → `{{account}}` → `{{manageAccount}}` → `{{twoFactorAuth}}`.
2. Tap `{{addFallback2faMethod}}` (it reads `{{change2faFallbackMethod}}` once one exists).
3. Confirm your identity.
4. Pick a method and complete the same setup steps as above.

You should now see `{{fallbackMethodEnabled}}`.

:::

## View or regenerate your recovery codes

Recovery codes are single-use codes that log you in when no 2FA method is reachable. Notesnook shows them once during setup, and you can pull them up again at any time.

:::tabs key:platform
== Desktop/Web

1. Go to `{{settings}}` → `{{authentication}}`.
2. Press `{{viewRecoveryCodes}}` and confirm the `{{verifyItsYou}}` prompt.
3. Use `{{print}}`, `{{copy}}` or `Download` to keep a copy. `Download` saves a `notesnook-recovery-codes.txt` file.
4. Press `{{regenerate}}` to replace the current set with a new one.

== Mobile

1. Go to `{{settings}}` → `{{account}}` → `{{manageAccount}}` → `{{twoFactorAuth}}`.
2. Tap `{{viewRecoveryCodes}}` and confirm your identity.
3. Use `{{copyCodes}}` or `{{saveToFile}}` — the file is saved as `notesnook_recoverycodes.txt`.

Regenerating codes is available on the desktop and web apps.

:::

::: warning Regenerating invalidates the old codes
Once you regenerate, the previous set stops working. Replace any copy you printed or stored.

:::

<!-- TODO: screenshot — the Save recovery codes screen with the Print / Copy / Download / Regenerate buttons -->

## What happens when you log in

After you enter your email and password, Notesnook asks for a 6-digit code:

- With an **authenticator app**, open the app and type the current code.
- With **email** or **SMS**, the code is sent automatically as the screen opens. `Resend code in …` is disabled for 60 seconds.
- The link at the bottom of the screen — `{{mfaAuthAppSelector}}`, `{{mfaEmailSelector}}` or `{{mfaSmsSelector}}` — opens `{{select2faMethod}}`, where you can switch to your fallback method or choose `{{recoveryCode}}`.

Entering a recovery code instead of a 6-digit code logs you in the same way.

## What if I lose my 2FA device?

Work through these in order:

1. **Use your fallback method.** On the code screen, follow the `Don't have access to …` link and pick your fallback.
2. **Use a recovery code.** From the same screen choose `{{recoveryCode}}` and enter one of the codes you saved.
3. **Log in on a device that is already signed in** and change your 2FA method from `{{settings}}` — an existing session does not need a fresh 2FA code.

::: danger Notesnook cannot bypass 2FA for you
If you have no fallback method, no recovery codes and no logged-in device, support cannot unlock the account — the same way we cannot recover your password or decrypt your notes. Save your recovery codes somewhere outside the phone that holds your authenticator app.

:::

## Turn 2FA off

The apps do not expose a switch to disable 2FA once it is enabled. What you can change is the primary method and the fallback method, from the same `{{twoFactorAuth}}` settings.

## Related pages

- [Plans & limits](/plans-and-limits) — which plans include SMS-based 2FA
- [Your account](/account-settings) — changing your email, password and recovery key
- [Recovering your account](/recovering-your-account) — what to do when you forget your password
- [How is my data encrypted?](/how-is-my-data-encrypted) — why 2FA and encryption protect different things
- [App lock](/app-lock) — locking the app itself on a device you already trust
