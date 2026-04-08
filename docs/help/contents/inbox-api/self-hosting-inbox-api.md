---
title: Self-Hosting Inbox API
description: Learn about self-hosting Notesnook's Inbox API.
---

> warn Beta feature
>
> Inbox API is still in beta so expect things to change and/or break. If you find any issues, kindly open an issue on our [GitHub repo](https://github.com/streetwriters/notesnook).

# Self-Hosting Inbox API

If you prefer not to send data through Notesnook's hosted inbox instance, you have two options:

1. **Run your own inbox server** — a drop-in replacement for `https://inbox.notesnook.com/` that you fully control.
2. **Skip the inbox server entirely** — encrypt the payload locally with `gpg` and post it directly to Notesnook's API.

Both approaches guarantee that unencrypted note content never touches a server you don't trust.

## Option 1: Run your own inbox server

The inbox server is a lightweight proxy: it fetches your PGP public key from Notesnook, encrypts the payload, and forwards it — no data is stored.

The source code and setup instructions are available in the [notesnook-sync-server](https://github.com/streetwriters/notesnook-sync-server/tree/master/Notesnook.Inbox.API) repository. Once running, replace `https://inbox.notesnook.com/` with your own instance URL in any API calls or automation tools.

> info
>
> Even on Notesnook's hosted instance, your payload is encrypted with your PGP public key before it leaves the server — it cannot be read in transit or at rest.

## Option 2: Encrypt locally and post directly

You can bypass the inbox server entirely by doing the encryption yourself with `gpg` and posting the result straight to Notesnook's API. This means nothing except the final encrypted blob ever leaves your machine.

### Step 1 — Fetch your PGP public key

```bash
curl -s https://api.notesnook.com/inbox/public-encryption-key \
  -H "Authorization: <your-inbox-api-key>" \
  | jq -r '.key' > inbox-public.asc
```

This saves your armored OpenPGP public key to `inbox-public.asc`. You only need to do this once (or after rotating your keys).

### Step 2 — Import the key into gpg

```bash
gpg --import inbox-public.asc
```

Note the key's fingerprint from the output — you'll need it in the next step.

### Step 3 — Prepare the note payload

Create a JSON file with the note data:

```bash
cat > note.json << 'EOF'
{
  "title": "My note title",
  "type": "note",
  "source": "local-gpg",
  "version": 1,
  "content": {
    "type": "html",
    "data": "<p>Note body here.</p>"
  }
}
EOF
```

### Step 4 — Encrypt the payload

```bash
gpg --encrypt \
    --armor \
    --recipient "<key-fingerprint-or-email>" \
    --output note.asc \
    note.json
```

This produces `note.asc`, an armored PGP ciphertext block.

### Step 5 — Post the encrypted payload to Notesnook

The Notesnook API expects a JSON object with three fields: `v` (always `1`), `alg` (always `"pgp-aes256"`), and `cipher` (the full armored ciphertext string).

```bash
CIPHER=$(cat note.asc)

curl -s -X POST https://api.notesnook.com/inbox/items \
  -H "Content-Type: application/json" \
  -H "Authorization: <your-inbox-api-key>" \
  -d "{\"v\": 1, \"alg\": \"pgp-aes256\", \"cipher\": $(jq -Rs . <<< "$CIPHER")}"
```

On success the API returns `200 OK`. The note will appear in Notesnook after your next sync.

### Full one-liner script

```bash
#!/usr/bin/env bash
set -euo pipefail

API_KEY="<your-inbox-api-key>"
FINGERPRINT="<key-fingerprint>"

PAYLOAD=$(cat <<EOF
{
  "title": "$1",
  "type": "note",
  "source": "local-gpg",
  "version": 1,
  "content": { "type": "html", "data": "$2" }
}
EOF
)

CIPHER=$(echo "$PAYLOAD" | gpg --encrypt --armor --recipient "$FINGERPRINT" 2>/dev/null)

curl -s -X POST https://api.notesnook.com/inbox/items \
  -H "Content-Type: application/json" \
  -H "Authorization: $API_KEY" \
  -d "{\"v\": 1, \"alg\": \"pgp-aes256\", \"cipher\": $(jq -Rs . <<< "$CIPHER")}"
```

Usage:

```bash
./send-to-notesnook.sh "Meeting notes" "<p>Discussed the Q4 roadmap.</p>"
```

> info
>
> After rotating your PGP keys in Notesnook settings, re-fetch the public key (Step 1) and re-import it before encrypting new payloads.
