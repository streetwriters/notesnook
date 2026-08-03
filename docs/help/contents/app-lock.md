---
title: App lock
pageTitle: Lock the Notesnook app with a PIN, password or biometrics
description: Turn on app lock in Notesnook to require a PIN, password, biometrics or a security key before your notes open, even when your device is already unlocked.
keywords:
  - lock notes app
  - password protect notes app
  - fingerprint lock notes
---

# App lock <PlanTag plan="pro" />

You can use app lock to restrict access to your app even when your system is unlocked. It works on desktop, web and mobile, and it is separate from the [private vault](/lock-notes-with-private-vault) — app lock covers the whole app, the vault covers individual notes.

App lock is part of the [Pro plan and above](/plans-and-limits). If a paid plan expires, app lock is switched off automatically, so set up your device's own lock screen if you rely on it.

## Ways to unlock

| Method                            | Where                   |
| --------------------------------- | ----------------------- |
| PIN or password                   | Desktop, web and mobile |
| Biometrics (fingerprint, Face ID) | Mobile                  |
| Security key                      | Desktop and web         |

## Turn on app lock

:::tabs key:platform
== Desktop/Web

1. Go to `{{settings}}` → `{{appLock}}`.
2. Turn on `{{enableAppLock}}`.
3. Enter a password or PIN when prompted, and confirm it.

![The App lock section of Notesnook desktop settings, with the Enable app lock switch turned on](/desktop-enable-app-lock.png)

== Mobile

1. Go to `{{settings}}` → `{{appLock}}`.

   ![The App lock entry in the Notesnook mobile settings list](/app-lock-setting.png)

2. Turn on `{{enableAppLock}}` and enter a PIN, or authenticate with your fingerprint or face.

   ![The App lock switch turned on in Notesnook mobile settings](/app-lock-setting-on-off.png)

:::

Notesnook now asks for your credential every time it starts, and after the timeout you set below.

## Set how long before it locks

`Lock app after` decides how long the app can sit idle before it locks itself again. `{{never}}` means Notesnook only asks when it starts.

:::tabs key:platform
== Desktop/Web

1. Go to `{{settings}}` → `{{appLock}}`.
2. Set `Lock app after` to `{{immediately}}`, `1`, `5`, `10`, `15`, `30` or `45` minutes, `1 hour`, or `{{never}}`.

![The Lock app after dropdown in Notesnook desktop settings, showing the available timeout intervals](/desktop-lock-app-after.png)

== Mobile

1. Go to `{{settings}}` → `{{appLock}}`.
2. Set `{{appLockTimeout}}` to `{{never}}`, `{{immediately}}`, `1`, `5`, `15` or `30` minutes.

   ![The App lock timeout options in Notesnook mobile settings](/app-lock-setting-time-out.png)

:::

## Change or remove your PIN, password or security key

:::tabs key:platform
== Desktop/Web

Under `{{credientials}}` on the same screen:

- `{{passwordPin}}` — press `{{change}}` to set a new one, or `{{disable}}` to remove it.
- `{{securityKey}}` — press `{{register}}` to add a hardware security key, or `{{unregister}}` to remove it.

![The Credentials section of Notesnook desktop app lock settings, with the password and security key options](/desktop-password-key.png)

== Mobile

- `{{setupAppLockPin}}` or `{{setupAppLockPassword}}` add a credential; once one exists the entries read `{{changeAppLockPin}}` and `{{changeAppLockPassword}}`.
- `{{removeAppLockPin}}` and `{{removeAppLockPassword}}` take one away. App lock is switched off entirely if you remove the last remaining method.

  ![Setting an app lock PIN in Notesnook on mobile](/setup-app-lock-pin.png)

  ![Changing or removing the app lock PIN in Notesnook settings on mobile](/change-remove-app-lock-pin.png)

:::

## Lock the app right now

Rather than waiting for the timeout, you can lock immediately. On desktop and web, click the lock icon in the status bar at the bottom of the window.

## Related pages

- [Private vault](/lock-notes-with-private-vault) — encrypt individual notes behind a separate password
- [Privacy mode](/privacy-mode) — stop screenshots and hide the app from the task switcher
- [How is my data encrypted?](/how-is-my-data-encrypted) — what protects your notes on the server
- [Plans & limits](/plans-and-limits) — what the Pro plan unlocks
