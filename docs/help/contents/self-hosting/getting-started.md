# Getting started

## Minimum server requirements

- **Operating system**: Linux
- **RAM**: 1 GB
- **Storage**: 20 GB
- **CPU**: any x64 or ARM CPU will do

## Prerequisites

1. Docker
2. Docker Compose
3. wget
4. curl
5. (Optional) Caddy or Nginx for reverse proxying

You **must** have a working Linux server with SSH access.

> warn Disclaimer
>
> How you secure or setup your server is up to you, and this guide will NOT provide any recommendations outside what is directly relevant to Notesnook.
>
> Self hosting means managing everything on your own so **we will not be responsible if you lose any data** during setup, upgrade, or any other step. It is recommended that you create regular backups in both the app and on the server to avoid this.

## Installation

1. Create a directory where configuration files can be placed:
   ```sh
   mkdir notesnook-sync-server
   ```
2. Navigate into the newly created directory:
   ```sh
   cd notesnook-sync-server
   ```
3. Download the `docker-compose.yml` file:
   ```sh
   wget https://raw.githubusercontent.com/streetwriters/notesnook-sync-server/master/docker-compose.yml
   ```
4. Download the `.env` file:
   ```sh
   wget https://raw.githubusercontent.com/streetwriters/notesnook-sync-server/master/.env
   ```

You should end up with the following files in the `notesnook-sync-server` directory:

- docker-compose.yml
- .env

## Configuration

All configuration is done via the `.env` file. You'll need to change very few settings to get the self-hosted containers up and running.

### `INSTANCE_NAME` (required)

This is used by the client apps to identify which instance you are using. You can just leave it the default value if you like, or set it to a personalized value like `john-doe-notesnook-server`.

### `NOTESNOOK_API_SECRET` (required)

The `NOTESNOOK_API_SECRET` is used for authenticating & validating the access tokens. This must be a randomly generated value otherwise anyone will be able to make authenticated requests to your server.

You can use OpenSSL to generate a secure random secret like this:

```sh
openssl rand -hex 32
```

### SMTP settings (required)

SMTP settings are required to enable sending 2FA and account reset emails. You can either use your email provider's SMTP settings (most email providers allow sending emails via SMTP) or you can create a free account on [SendGrid](http://sendgrid.com/) or [Brevo/SendInBlue](https://www.brevo.com). Both of these providers allow sending emails via SMTP in their free tiers.

| Variable        | Description                                                                                                                                      | Required? | Example        |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | --------- | -------------- |
| `SMTP_USERNAME` | Username for the SMTP connection. Usually it is the email address but check your email provider's documentation to see what you should put here. | yes       |
| `SMTP_PASSWORD` | Password for the SMTP connection. Check your email provider's documentation to see what you should put here.                                     | yes       |
| `SMTP_HOST`     | Host on which the the SMTP connection is accessible.                                                                                             | yes       | smtp.gmail.com |
| `SMTP_PORT`     | Port on which the the SMTP connection is accessible.                                                                                             | yes       | 465            |

### Public URL settings (required)

Public URLs are how the servers can generate valid publicly accessible URLs for different things like email confirmation, password reset links etc. These URLs must be accessible from _outside_ of where you are hosting your servers (e.g. by using a reverse proxy like Nginx).

| Variable                        | Description                                                                                                                    | Required? | Example                   |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ | --------- | ------------------------- |
| `NOTESNOOK_APP_PUBLIC_URL`      | If you are self hosting the web app, you should put its URL here. Otherwise leave it as is.                                    | yes       | https://app.notesnook.com |
| `AUTH_SERVER_PUBLIC_URL`        | Publicly accessible URL for the auth server. You usually expose this URL via a reverse proxy like Caddy/Nginx.                 | yes       | https://auth.example.com  |
| `MONOGRAPH_PUBLIC_URL`          | Publicly accessible URL for the monographs. You usually expose this URL via a reverse proxy like Caddy/Nginx.                  | yes       | https://monogr.ph         |
| `ATTACHMENTS_SERVER_PUBLIC_URL` | Publicly accessible URL for the attachments (aka S3) server. You usually expose this URL via a reverse proxy like Caddy/Nginx. | yes       | https://s3.example.com    |

### `DISABLE_SIGNUPS` (required)

Set this to `true` to disable new accounts from being created on your server.

### Minio settings (optional)

| Variable              | Description                                | Default    |
| --------------------- | ------------------------------------------ | ---------- |
| `MINIO_ROOT_USER`     | Custom username for the root Minio account | minioadmin |
| `MINIO_ROOT_PASSWORD` | Custom password for the root Minio account | minioadmin |

You should change these values to something random & secure just to be safe. The Minio internal API & dashboard ports are not exposed for external use so you are probably safe with the default values but don't take my word for it. Change the password. You won't regret it.

### `NOTESNOOK_CORS_ORIGINS` (optional)

CORS is used to prevent unknown and arbitrary origins from making requests to your server. This is useful, for example, if you want to allow requests only from `https://app.notesnook.com` and reject everything else.

By default, all origins are allowed which means anyone from any domain can make requests to your server. You probably don't want this if you are using self hosted clients.

For example, to restrict traffic only to `yourdomain.com`, you should set this to:

```
NOTESNOOK_CORS_ORIGINS=https://yourdomain.com
```

If you want to allow multiple domains, just separate them using commas:

```
NOTESNOOK_CORS_ORIGINS=https://yourdomain.com,https://yourotherdomain.com
```

### Twilio settings (optional)

Twilio is used for SMS based 2FA. If you don't plan on using 2FA via SMS then leave these settings empty.

| Variable             | Description                                                                                                              | Example                            |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------ | ---------------------------------- |
| `TWILIO_ACCOUNT_SID` | [Learn more here](https://help.twilio.com/articles/14726256820123-What-is-a-Twilio-Account-SID-and-where-can-I-find-it-) |
| `TWILIO_AUTH_TOKEN`  | [Learn more here](https://help.twilio.com/articles/223136027-Auth-Tokens-and-How-to-Change-Them)                         |
| `TWILIO_SERVICE_SID` | The unique string that we created to identify the Service resource.                                                      | VAaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa |

## Starting the server

Once you are done configuring your server, it's time to run it:

```sh
docker compose up -d
```

To make sure everything is working well, run:

```sh
docker ps
```

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

In total, you should have 7 containers up and running. If there are less than 7 that means something failed. If you see `Unhealthy` anywhere, that means something went wrong. Refer to the troubleshooting guide to see how you can debug this.

## Exposing the servers to the Internet

Running the docker containers on device is all well and good but if you want to connect your other devices, sync your notes, you need to expose the servers over the Internet. Even if you only require local access, it is recommended that you use something like Tailscale or Cloudflare Tunnels to securely & reliably expose the Notesnook servers.

> error HTTPS is required
>
> You won't be able to sync or login without HTTPS. This is **not** mandated by Notesnook but by the vendors running the client apps (i.e. all major browsers diallow HTTP connections).

> info
>
> These instructions assume that you did not change the ports for the servers inside the `docker-compose.yml` file. If you did change the default ports, you'll have to use those instead.

### Using Caddy (recommended)

Caddy is one of the simplest ways to reverse proxy traffic from the Internet to your servers.

> info
>
> If you already have a `Caddyfile`, just use that.

1. Create or edit your `Caddyfile` (you can do this literally anywhere). For default installations, you'll find the `Caddyfile` in `/etc/caddy/Caddyfile`.
2. Paste the following configuration into the `Caddyfile`

   ```
   sync.example.com {
           reverse_proxy :5264
   }

   auth.example.com {
           reverse_proxy :8264
   }

   sse.example.com {
           reverse_proxy :7264
   }

   monograph.example.com {
           reverse_proxy :6264
   }

   s3.example.com {
           reverse_proxy :9000
   }
   ```

3. Change the domain names as appropriate.
4. Restart Caddy (run `systemctl restart caddy` if you are running it as a daemon)
5. And done! You should now have a working SSL connection to all your servers.

### Using Nginx

Configuring Nginx is a bit more complicated than Caddy. If you are a beginner, you should probably stick to using Caddy. This guide assumes you already know how Nginx works and how to configure it.

1. Create an Nginx configuration file in `/etc/nginx/sites-available` and paste the following into it:

   ```nginx
    # Sync server
    server {
        server_name sync.example.com;
        location / {
            proxy_pass http://127.0.0.1:5264;
            include proxy_params;

            proxy_redirect off; # required
            proxy_http_version 1.1; # required
            proxy_set_header Upgrade $http_upgrade; # required
            proxy_set_header Connection "upgrade"; # required
        }
    }

    # SSE server
    server {
        server_name sse.example.com;
        location / {
            proxy_pass http://127.0.0.1:7264;
            include proxy_params;

            proxy_set_header Connection ''; # required
            proxy_http_version 1.1; # required
            chunked_transfer_encoding off; # required
            proxy_buffering off; # required
            proxy_cache off; # required
        }
    }

    # Auth server
    server {
        server_name auth.example.com;
        location / {
            proxy_pass http://127.0.0.1:8264;
            include proxy_params;
        }
    }

    # Monograph server
    server {
        server_name monograph.example.com;
        location / {
            proxy_pass http://127.0.0.1:6264;
            include proxy_params;
        }
    }

    # S3 server
    server {
        server_name s3.example.com;
        location / {
            proxy_pass http://127.0.0.1:9000;
            include proxy_params;
            client_max_body_size 1024M; # required
        }
    }
   ```

2. Change the `server_name`s as appropriate.
3. Run `nginx -t` and make sure there are no errors
4. Restart nginx (`systemctl restart nginx`)
5. And done! You should have a working HTTP connection to all your servers.
6. **To enable SSL, [use CertBot](https://certbot.eff.org/instructions?ws=nginx&os=snap).**

> info Cloudflare DNS users
>
> If you are using Cloudflare for DNS, make sure the DNS settings for these domains are set to DNS-only instead of Proxied. While the Proxied mode might work, it is not tested so use at your own risk.

## Testing the connection

You installed, configured, and set up everything but how can you be sure your devices can access your servers? That's where `curl` comes in.

All the above services provide a healthcheck endpoint to allow checking their status. You can run a healthcheck like this:

```sh
curl https://sync.example.com/health
```

You should see `Healthy` printed on the screen.

## Connecting the client apps
