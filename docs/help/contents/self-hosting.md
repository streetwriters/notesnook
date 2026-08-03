---
title: Self-hosting
pageTitle: How do I self-host Notesnook?
description: Point the Notesnook apps at your own sync, auth, events and monograph servers. What each server does, and what Test connection actually checks.
keywords:
  - self host notesnook
  - notesnook sync server
  - notesnook custom server url
  - notesnook server configuration
---

# How do I self-host Notesnook?

Every Notesnook app — web, desktop and mobile — lets you replace the servers it talks to with your own. You point the app at four URLs, test them, save, and the app restarts against your infrastructure. Your notes stay end-to-end encrypted either way; self-hosting means the encrypted data never touches Notesnook's machines.

## Getting Started

This guide assumes you are already familiar with the command line and basic systems security. Notesnook is not responsible for issues that may arise from improper configuration of the server. You are fully responsible for making adequate backups and for the security of your data and server.

### Hardware requirements

- Operating System: Linux.
- RAM: 1 Gigabyte.
- CPU: Any ARM or x86 cpu, as long as it supports AVX.
- Storage: 20 gigabytes.

### Prerequisites

1. Docker
2. Docker Compose
3. wget
4. curl
5. (optional) A reverse proxy, like Caddy or Ngnix.

This guide assumes you already have a Linux server set up and ready to go.

### Installation

1. Create a directory where your configuration files will go.

`mkdir notesnook-sync-server`

2. Enter this directory.

`cd notesnook-sync-server`

3. Download the `docker-compose.yml` file.

`wget https://raw.githubusercontent.com/streetwriters/notesnook-sync-server/master/docker-compose.yml`

4. Download the `.env` file, this is where most (if not all) of your configuration belongs.

`wget https://raw.githubusercontent.com/streetwriters/notesnook-sync-server/master/.env`

You should now have two files in your directory:

- `docker-compose.yml`
- `.env`

### Configuration

Open the `.env` file into an editor. This guide will go over the minimum you need to change.

:::warning This guide does not cover setting up an SMTP server!
You **will have to** do this if you plan on using the password reset feature, or want to use email-based two factor auth (the default). If you don't change the two factor method after creating your account, you may become locked out of the account. You have been warned.

:::

#### `INSTANCE_NAME`

This is used by the Notesnook clients to show which server you are connecting to on the login/signup pages. It should be unique to your server, something like `john-doe-notesnook-server` is adequate. The default value _also_ works, but we recommend you change it.

#### `NOTESNOOK_API_SECRET`

This is used by the server to validate access tokens. It should be a long, random value. If you need to create one, use this command. `openssl rand -hex 32`

#### `DISABLE_SIGNUPS`

This is a setting you should change after signing up, unless you want your server to be open registration.

#### Public URLs

Public URLs are how the servers can generate valid publicly accessible URLs for different things like email confirmation, password reset links etc. These URLs must be accessible from _outside_ of where you are hosting your servers (e.g. by using a reverse proxy like Nginx).

| Variable                        | Description                                                                                         | Example                                            |
| ------------------------------- | --------------------------------------------------------------------------------------------------- | -------------------------------------------------- |
| `NOTESNOOK_APP_PUBLIC_URL`      | If you're self-hosting the web app too, you put the url to it here, otherwise, leave it alone.      | [https://app.notesnook.com/](#public-urls)         |
| `MONOGRAPH_PUBLIC_URL`          | This is the url for the monograph server, it is also where published notes will be accessible from. | [https://monogr.ph/](#public-urls)                 |
| `AUTH_SERVER_PUBLIC_URL`        | This is the url for the auth server.                                                                | [https://auth.streetwriters.co/](#public-urls)     |
| `ATTACHMENTS_SERVER_PUBLIC_URL` | This is the url for the attachments server. It's where your attachments will be downloaded from.    | [https://attachments.notesnook.com/](#public-urls) |

You don't need to configure the sse/events server's public url in the `.env` file, but it is required to forward it through your reverse proxy.

#### Starting the server

Now that you've configured the server, let's take it for a test-drive!

Run `docker compose up -d`, and Docker Compose will make the magic happen.

Once everything is shown as started, wait a moment, and then run `docker compose ps`

You should see something like this:

```
3c39da9194db   streetwriters/sse:latest                   "./Streetwriters.Mes…"   38 minutes ago   Up 38 minutes (healthy)   0.0.0.0:7264->7264/tcp, :::7264->7264/tcp  notesnook-sse-server-1
19c4a6536578   streetwriters/monograph:latest             "docker-entrypoint.s…"   38 minutes ago   Up 38 minutes (healthy)   0.0.0.0:6264->3000/tcp, [::]:6264->3000/tcp  notesnook-monograph-server-1
7b9db61b5d0d   streetwriters/notesnook-sync:latest        "./Notesnook.API"        38 minutes ago   Up 38 minutes (healthy)   0.0.0.0:5264->5264/tcp, :::5264->5264/tcp  notesnook-notesnook-server-1
6491b172817e   streetwriters/identity:latest              "./Streetwriters.Ide…"   38 minutes ago   Up 38 minutes (healthy)   0.0.0.0:8264->8264/tcp, :::8264->8264/tcp  notesnook-identity-server-1
bfb71f21e57b   minio/minio:RELEASE.2024-07-29T22-14-52Z   "/usr/bin/docker-ent…"   38 minutes ago   Up 38 minutes (healthy)   0.0.0.0:9000->9000/tcp, :::9000->9000/tcp  notesnook-notesnook-s3-1
d27f6207fb93   mongo:7.0.12                               "docker-entrypoint.s…"   38 minutes ago   Up 38 minutes (healthy)   27017/tcp  notesnook-notesnook-db-1
2bde52e0102d   willfarrell/autoheal:latest                "/docker-entrypoint …"   38 minutes ago   Up 38 minutes (healthy)  notesnook-autoheal-1
```

Everything should show as healthy, and there should be 7 containers listed at this point. If there are less than 7, or any show as unhealthy, something went wrong. Our [Discord community](https://go.notesnook.com/discord) may be able to assist you.

#### Exposing to the internet

Running the Docker containers on device is all well and good, but if you want to connect your other devices, sync your notes to them, you'll need to expose the servers over the internet. Even if you only require local access, it is recommended that you use something like Tailscale or Cloudflare Tunnels to securely & reliably expose the Notesnook servers.

:::warning HTTPS is required.
**HTTPS is required by the browser and mobile apps**. Notesnook does not necessarily mandate this, but your browser and mobile operating system may.

:::

This guide will cover hosting Notesnook using a Cloudflare Tunnel, as we believe it is the easiest option, doesn't require port forwarding, and HTTPS is automatically set up.

1. Log into the Cloudflare dashboard. We're assuming you already have your domain name set up and added to your Cloudflare account. If you don't, do that now.
2. In the dashboard, on the sidebar, find `Protect & connect`, open the drop down for `Networking`, and choose `Tunnels`.
3. On the top right of the page that loads, select `Create Tunnel`.
4. Name your tunnel, then select `Create tunnel` again.
5. Select `Docker` from the list of options and copy the command. We'll use values from it later.
6. Open up the `docker-compose.yml` file, and at the bottom of the `services:` section, add this:

```
  cloudflare:
    image: cloudflare/cloudflared:latest
    networks:
      - notesnook
    depends_on:
      - monograph-server
    command:
```

7. Now, paste in the command you copied from the cloudflare dash, it should look like this: `docker run cloudflare/cloudflared:latest tunnel --no-autoupdate run --token eyJh...J9`

8. Remove `docker run cloudflare/cloudflared:latest` from the beginning of the command, and save your changes to the file.

9. Restart your Docker containers by running `docker compose down` and `docker compose up -d`. In a moment, everything should start back up, and the continue button on the cloudflare dash will light up, allowing you to proceed.

10. Now you add your domains that you configured earlier to the newly created tunnel. To do this, click your new tunnel in the dashboard, then select `Routes` at the top.

11. Click `Add route`, then select `Published application`. You'll configure your subdomain, and for the `Service URL` field you should see the table below. Repeat this for each service listed.

:::tip What to do if you changed the port configuration
If you changed ports for a service, **use the configured port** instead of the default ones shown below. If you haven't already, you may additionally need to double check that your `docker-compose.yml` file doesn't use the defaults.

:::

| Service            | Service URL                                               |
| ------------------ | --------------------------------------------------------- |
| Sync server        | [http://notesnook-server:5264](#exposing-to-the-internet) |
| Monograph server   | [http://monograph-server:3000](#exposing-to-the-internet) |
| Events/SSE server  | [http://sse-server:7264](#exposing-to-the-internet)       |
| Attachments server | [http://notesnook-s3:9000](#exposing-to-the-internet)     |
| Auth server        | [http://identity-server:8264](#exposing-to-the-internet)  |

:::info
The attachments server doesn't get entered into the client, the public url is used by the sync server to generate signed S3 links. Those are scoped to a specific hostname.

:::

You should now [configure your client](#point-notesnook-at-your-own-servers) to ensure that everything is publicly accessible, everything should be now. The `{{testConnection}}` button is the easiest way to do this, as it will tell you which server is not reachable, should anything be wrong.

## What servers do I need to configure in my client?

Four, and all of them are required.

| Server                | What it does                                                     |
| --------------------- | ---------------------------------------------------------------- |
| `{{syncServer}}`      | _"Server used to sync your notes & other data between devices."_ |
| `{{authServer}}`      | _"Server used for login/sign up and authentication."_            |
| `{{sseServer}}`       | _"Server used to receive important notifications & events."_     |
| `{{monographServer}}` | _"Server used to host your published notes."_                    |

By default these are `https://api.notesnook.com`, `https://auth.streetwriters.co`, `https://events.streetwriters.co` and `https://monogr.ph`.

The apps validate all four together — you cannot self-host the sync server and leave the others pointing at Notesnook. `{{allServerUrlsRequired}}`

## You must be logged out to change server URLs

Every field and button on the servers screen is disabled while you are signed in, and the app tells you so: `{{logoutToChangeServerUrls}}`

This is not an arbitrary restriction. Your account, your keys and your data live on whichever backend you were using; switching backends while logged in would leave the app holding a session the new server knows nothing about.

::: warning Make a backup, then log out.
Take a [backup](/backup-and-restore-notes-in-notesnook) before logging out of notesnook to change your server configuration. An account on Notesnook's servers does not exist on your own. You'll have to sign up again on your instance, and you bring your notes over by restoring your backup. **Notesnook cannot move an account between backends for you.**

:::

## Point Notesnook at your own servers

:::tabs key:platform
== Desktop/Web

1. Log out.
2. Open `{{settings}}` → `{{customization}}` → `{{servers}}`.
3. Fill in all four URLs — `{{syncServer}}`, `{{authServer}}`, `{{sseServer}}` and `{{monographServer}}`. Each field shows an example such as `e.g. http://localhost:4326`.
4. Press `{{testConnection}}`. On success you see `{{connectedToServer}}`
5. Press `{{save}}`.

`{{save}}` stays disabled until `{{testConnection}}` has passed. After saving, a dialog reads `App will reload in 5 seconds` — _"Your changes have been saved and will be reflected after the app has refreshed."_ — and the app reloads itself.

== Mobile

1. Log out.
2. Open `{{settings}}` → `{{customization}}` → `{{servers}}`.
3. Fill in all four URLs. Each field is labelled with the server id and an example, such as `notesnook-sync e.g. http://localhost:4326`.
4. Tap `{{testConnection}}`. On success you see `{{connectedToServer}}`
5. Tap `{{save}}`.

Tapping `{{save}}` before testing shows `{{testConnectionBeforeSave}}`. After saving you get a `{{serverUrlChanged}}` dialog reading `{{restartAppToTakeEffect}}` — close the app fully and reopen it.

:::

<!-- TODO: screenshot — the Servers configuration screen with the four URL fields and the Test connection button -->

## What does "Test connection" actually check?

For each of the four servers in turn, the app requests that server's version endpoint — `/version`, or `/api/version` for the monograph server — and checks three things:

1. **Is it reachable?** If the request fails or returns something that isn't JSON: `Could not connect to <server>.`
2. **Is it the right server?** The response identifies which server it is. If the sync URL answers with the auth server's identity, you get `The URL you have given (<url>) does not point to the <server>.` This catches the classic copy-paste mistake of putting the same host in every field.
3. **Does it speak this app's protocol version?** If the server's API version doesn't match what this build of the app expects: `The <server> at <url> is not compatible with this client.` Update the server, or use an app build from the matching release.

Only when all four pass does the app report `{{connectedToServer}}` and let you save.

## Go back to Notesnook's servers

:::tabs key:platform
== Desktop/Web

1. Log out.
2. Open `{{settings}}` → `{{customization}}` → `{{servers}}`.
3. Press `{{reset}}`.

The app reloads after 5 seconds.

== Mobile

1. Log out.
2. Open `{{settings}}` → `{{customization}}` → `{{servers}}`.
3. Tap `{{resetServerUrls}}`.

You get a `{{serverUrlsReset}}` dialog reading `{{restartAppToTakeEffect}}` — close and reopen the app.

:::

Your notes on your hosted server are untouched by the app reset, but the account you used on your own instance does not exist on Notesnook's servers. You'll have to log in (or sign up) again, and restore a backup to transfer your data back over.

## Can I self-host the Inbox API too?

Yes, and separately from the entire list of servers above. The inbox service, the one that accepts notes posted in from scripts and automations, can be hosted separately from the sync server. This means that you can host your own inbox server, even while using the official Notesnook server. See [self-hosting the Inbox API](/inbox-api/self-hosting-inbox-api) for more information.

## Related pages

- [How sync works](/sync/how-sync-works) — what the sync server actually receives from your device
- [Sync troubleshooting](/sync/troubleshooting-sync) — connection errors, including ones naming a specific server
- [Sync settings](/sync/sync-settings) — offline mode and sync controls, which work the same self-hosted
- [Self-hosting the Inbox API](/inbox-api/self-hosting-inbox-api) — running your own inbox endpoint
- [How is my data encrypted?](/how-is-my-data-encrypted) — why the server never sees your notes, hosted or not
- [Backup and restore](/backup-and-restore-notes-in-notesnook) — how you carry notes between backends
