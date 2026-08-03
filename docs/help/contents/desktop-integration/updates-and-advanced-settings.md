---
title: Updates & advanced
pageTitle: Notesnook desktop updates, release track and network settings
description: Control how the Notesnook desktop app updates, switch between the Stable and Beta release tracks, and change the titlebar, zoom, DNS, proxy and CORS proxy.
keywords:
  - notesnook desktop update
  - notesnook beta release track
  - notesnook native titlebar
  - notesnook proxy
  - notesnook custom dns
---

# Updates and advanced settings

::: info Mostly, but not only, the desktop app
`{{useNativeTitlebar}}`, `{{zoomFactor}}` and `{{useCustomDns}}` are desktop-only. The update controls, `{{releaseTrack}}`, `{{proxy}}` and the CORS proxy also appear in the web app, where an "update" means swapping the service worker rather than downloading an installer.

:::

## Keep the app updated automatically

When automatic updates are on, the desktop app downloads new versions in the background. Updates are never installed silently on quit — you always trigger the install yourself, which avoids a half-written install directory if your machine shuts down mid-update.

1. Go to `{{settings}}`.
2. Open `{{customization}}` → `{{behaviour}}`.
3. Under `{{desktopApp}}`, toggle `{{automaticUpdates}}`.

## Check for updates manually

1. Go to `{{settings}}`.
2. Open `{{other}}` → `{{about}}`.
3. The `{{version}}` row shows the version you're running. Click `{{checkForUpdates}}`.
4. If a new version is found the description changes to `New version (vX.X.X) is available for download.` and the button becomes `{{installUpdate}}`. Clicking it downloads the update; once the download finishes, the update button in the status bar installs it and restarts the app.

::: info Flatpak, Snap and portable builds
These builds are updated by the system that installed them, so the `{{automaticUpdates}}` toggle, `{{checkForUpdates}}` and `{{installUpdate}}` buttons don't appear. Only `{{copy}}` (for the version number) is shown.

:::

## Switch between the Stable and Beta release track

The release track decides which builds you receive. `{{beta}}` gets features earlier, with the usual caveat that they are less tested.

1. Go to `{{settings}}`.
2. Open `{{other}}` → `{{about}}`.
3. Set `{{releaseTrack}}` to `{{stable}}` or `{{beta}}`.

Switching from `{{beta}}` back to `{{stable}}` is allowed to downgrade you, but only if the build you are running is itself a prerelease. This setting is also hidden on Flatpak, Snap and portable builds.

::: warning Beta builds are still beta
Keep [current backups](/backup-and-restore-notes-in-notesnook) before moving to the beta track.

:::

## Use your system's native titlebar

By default Notesnook draws its own titlebar. You can switch to the one your operating system draws instead.

1. Go to `{{settings}}`.
2. Open `{{customization}}` → `{{desktopIntegration}}`.
3. Toggle `{{useNativeTitlebar}}`.
4. A toast appears reading `{{restartAppToTakeEffect}}` — click `{{restartNow}}`, or restart later yourself.

## Change the zoom factor

Zoom scales the whole app, not only the editor text.

1. Go to `{{settings}}`.
2. Open `{{customization}}` → `{{appearance}}`.
3. Under `{{general}}`, set `{{zoomFactor}}`. It accepts `0.5` to `3.0` in steps of `0.1`.

## Use custom DNS

Notesnook can resolve its own hostnames over DNS-over-HTTPS instead of using your system resolver. This sometimes gets around ISP-level blocking of Notesnook traffic.

1. Go to `{{settings}}`.
2. Open `{{privacyAndSecurity}}` → `{{privacy}}`.
3. Under `{{advanced}}`, toggle `{{useCustomDns}}`.

When it is on, the app resolves through **Cloudflare DNS** (`mozilla.cloudflare-dns.com`) and **Quad9** (`dns.quad9.net`). Turn it off to go back to your system's DNS settings.

## Route the app through a proxy

1. Go to `{{settings}}`.
2. Open `{{privacyAndSecurity}}` → `{{privacy}}`.
3. Under `{{advanced}}`, type your rules into `{{proxy}}`.

HTTP, HTTPS and SOCKS proxies are supported, for example:

```
http://foobar:80
socks4://proxy.example.com
http://username:password@foobar:80
```

## Change the CORS proxy

Remote content the editor has to fetch — images pasted by URL and YouTube embeds — is routed through a proxy so the browser's cross-origin rules don't block it. The default is `https://cors.notesnook.com`. You can point it at your own if you'd rather not use ours.

1. Go to `{{settings}}`.
2. Open `{{privacyAndSecurity}}` → `{{privacy}}`.
3. Under `{{advanced}}`, next to `{{corsBypass}}`, click `{{changeProxy}}`.
4. Enter the URL and confirm. Only the scheme and hostname are kept; an unparseable URL is rejected with `{{invalidCors}}`.

This setting exists in the web app too.

## Related pages

- [Auto start on system startup](/desktop-integration/auto-start-on-system-startup) — launch Notesnook when you log in
- [System tray menu](/desktop-integration/system-tray-menu) — quick actions and minimize-to-tray
- [Spell checker](/desktop-integration/spell-checker) — enable it and pick languages
- [Privacy mode](/privacy-mode) — hide the app window from screen capture
- [Backup and restore](/backup-and-restore-notes-in-notesnook) — before you switch release tracks
