---
title: App lock
pageTitle: Lock the Notesnook app with a PIN, password or biometrics
description: Turn on app lock in Notesnook to require a PIN, password, biometrics or a security key before your notes can be opened, even when your device is already unlocked.
keywords:
  - lock notes app
  - password protect notes app
  - fingerprint lock notes
---

# App lock <PlanTag plan="pro" />

You can use app lock to restrict access to your app even when your system is unlocked. It works on desktop, web and mobile, and it is separate from the [private vault](/lock-notes-with-private-vault) — app lock covers the whole app, the vault covers individual notes.

App lock is part of the [Pro plan and above](/plans-and-limits). If a paid plan expires, app lock is switched off automatically, so set up your device's own lock screen if you rely on it.

## Ways to unlock

| Method | Where |
| --- | --- |
| PIN or password | Desktop, web and mobile |
| Biometrics (fingerprint, Face ID) | Mobile |
| Security key | Desktop and web |

## How long before it locks

On desktop and web the `Lock app after` options are `{{immediately}}`, `1`, `5`, `10`, `15`, `30`, `45` minutes, `1 hour` or `Never`. On mobile they are `Never`, `Immediately`, `1`, `5`, `15` and `30` minutes. `Never` means the app only asks when it starts.

::: danger Don't forget your app lock credential
App lock is a local, device-only lock and is completely separate from your account password. If you forget your app lock password/pin (and don't have a working biometric or security key fallback), there is no in-app way to reset it and you will be locked out of the app **on that device**. Your notes themselves are not lost — they remain safely synced to your account — but to regain access you'll need to reinstall the app (or clear its local data) and log back in, which discards any local changes that hadn't synced yet.
:::

:::tabs key:platform
== Desktop

### Turn on App Lock

1. Go to Settings and Click App lock. Then turn on the App lock switch. You will be prompted to enter your App Lock Password. When it is successful App Lock will be turned on.

<img src="/desktop-enable-app-lock.png" alt="drawing" height="500"/>

### Setting App Lock Time Out

2. You can set the time out for your App Lock from one minute to an hour or you can turn it off by setting it to **Never**.

<img src="/desktop-lock-app-after.png" alt="drawing" height="500"/>

### Change Password

3. You can also change the pin or password or you can set a security key if you want a more secure app.

<img src="/desktop-password-key.png" alt="drawing" height="500"/>

== Mobile

### Turn on App Lock

1. Go to Settings and Tap App lock.

   <img src="/app-lock-setting.png" alt="drawing" height="500"/>

2. Then turn on the App lock switch. You will be prompted to enter a pin or fingerprint. When it is successful App Lock will be turned on.

   <img src="/app-lock-setting-on-off.png" alt="drawing" height="500"/>

### Setting App Lock Time Out

3. You can set the time out for your App Lock

   <img src="/app-lock-setting-time-out.png" alt="drawing" height="500"/>

### Set a pin

4. You can set a pin instead of a fingerprint if you are more comfortable with it (or if your mobile is not fingerprint friendly).

   <img src="/setup-app-lock-pin.png" alt="drawing" height="500"/>

5. You can also change or remove the pin.

   <img src="/change-remove-app-lock-pin.png" alt="Changing or removing the app lock PIN in Notesnook settings on mobile" height="500"/>
:::

## Lock the app right now

Rather than waiting for the timeout, you can lock immediately: on desktop and web click the lock icon in the status bar at the bottom of the window.

## Related pages

- [Private vault](/lock-notes-with-private-vault) — encrypt individual notes behind a separate password
- [Privacy mode](/privacy-mode) — stop screenshots and hide the app from the task switcher
- [How is my data encrypted?](/how-is-my-data-encrypted) — what protects your notes on the server
- [Plans & limits](/plans-and-limits) — what the Pro plan unlocks
