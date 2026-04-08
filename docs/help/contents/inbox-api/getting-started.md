---
title: Getting Started
description: Learn about Notesnook's Inbox API.
---

> warn Beta feature
>
> Inbox API is still in beta so expect things to change and/or break. If you find any issues, kindly open an issue on our [GitHub repo](https://github.com/streetwriters/notesnook).

# Getting started with the Inbox API

Think of the Inbox API as a private mailbox for your Notesnook account. You give other apps or services a key to drop notes into it, and those notes show up in your Notesnook account the next time you sync — fully encrypted, readable only by you.

You don't need to be a developer to use it. You can use services like Zapier and IFTTT to send data directly to the Inbox API without writing a single line of code. If you do write code, it's a single `HTTP POST` request.

## Use cases

Some common use cases include:

- Forwarding inbound emails to Notesnook as notes via Zapier or IFTTT.
- Capturing web content or RSS feeds automatically.
- Integrating a custom server or internal tool with Notesnook.
- Automating data capture from other apps.

## How to use Inbox API

### 1. Enable Inbox API from settings.

# [Desktop/Web](#/tab/web)

1. Go to Settings > Inbox
2. Turn on the `Enable Inbox API` toggle
3. Choose whether you want to use your own PGP keypair or let Notesnook autogenerate one for you

# [Mobile](#/tab/mobile)

`Settings > Inbox > Enable Inbox API`.

---

> info
>
> The PGP keys are validated (round-trip encrypt/decrypt) before being saved.

### 2. Create your Inbox API Key

A default API key is created automatically when you enable the Inbox API. You can create up to 10 API keys and revoke them individually.

# [Desktop/Web](#/tab/web)

1. Go to Settings > Inbox
2. Click `Create Key` in the `API Keys` section
3. Set a name for the API Key (e.g. Zapier)
4. Set an expiry date

# [Mobile](#/tab/mobile)

`Settings > Inbox > View API Keys > +`.

---

### 3. Send data to the Inbox

**Endpoint**: `POST https://inbox.notesnook.com/`

#### Headers

| Header          | Type   | Status       | Description                |
| --------------- | ------ | ------------ | -------------------------- |
| `Content-Type`  | string | **Required** | Must be `application/json` |
| `Authorization` | string | **Required** | Your inbox API key         |

#### Request Body

| Field          | Type     | Status                             | Description                                           |
| -------------- | -------- | ---------------------------------- | ----------------------------------------------------- |
| `title`        | string   | **Required**                       | Note title. Minimum 1 character.                      |
| `type`         | string   | **Required**                       | Entity type. Currently only `"note"` is supported.    |
| `source`       | string   | **Required**                       | Source identifier (e.g., `"zapier"`, `"my-app"`).     |
| `version`      | number   | **Required**                       | Schema version. Must be `1`.                          |
| `content`      | object   | Optional                           | Note content.                                         |
| `content.type` | string   | **Required** (if content provided) | Content format. Currently only `"html"` is supported. |
| `content.data` | string   | **Required** (if content provided) | HTML content string.                                  |
| `pinned`       | boolean  | Optional                           | Pin the note. Default: `false`.                       |
| `favorite`     | boolean  | Optional                           | Mark as favorite. Default: `false`.                   |
| `readonly`     | boolean  | Optional                           | Make the note read-only. Default: `false`.            |
| `archived`     | boolean  | Optional                           | Archive the note. Default: `false`.                   |
| `notebookIds`  | string[] | Optional                           | Array of notebook IDs to assign the note to.          |
| `tagIds`       | string[] | Optional                           | Array of tag IDs to apply to the note.                |

> info Notebook & Tag IDs
>
> Notebook and Tag IDs can be found by right-clicking on a notebook/tag and selecting `Copy ID`.

#### Limits

| Limit         | Value                         |
| ------------- | ----------------------------- |
| Max body size | 10 MB                         |
| Rate limit    | 60 requests per minute per IP |

#### Responses

| Status                      | Body                                                         | Condition                                                                        |
| --------------------------- | ------------------------------------------------------------ | -------------------------------------------------------------------------------- |
| `200 OK`                    | `{ "success": true }`                                        | Note successfully encrypted and queued.                                          |
| `400 Bad Request`           | `{ "error": "invalid item", "details": [...] }`              | Request body failed validation. The `details` array contains field-level errors. |
| `401 Unauthorized`          | `{ "error": "unauthorized" }`                                | `Authorization` header is missing.                                               |
| `403 Forbidden`             | `{ "error": "inbox public key not found" }`                  | Inbox is not enabled or no PGP public key is associated with your account.       |
| `429 Too Many Requests`     | —                                                            | Rate limit exceeded. Retry after 1 minute.                                       |
| `500 Internal Server Error` | `{ "error": "internal server error", "description": "..." }` | Unexpected server error.                                                         |

#### Example Request

```bash
curl -X POST https://inbox.notesnook.com/ \
  -H "Content-Type: application/json" \
  -H "Authorization: <your-inbox-api-key-here>" \
  -d '{
    "title": "My Important Note",
    "type": "note",
    "source": "my-app",
    "version": 1,
    "content": {
      "type": "html",
      "data": "<h1>Meeting Notes</h1><p>Discussed Q4 roadmap</p>"
    },
    "favorite": true,
    "tagIds": ["67aecf3b9e1398484554bc90"]
  }'
```

## Integration examples

### Zapier — Forward Gmail emails to Notesnook

This Zap sends every new email you receive in your Gmail inbox to your Notesnook account as a note.

**1. Create a new Zap and set up the trigger:**

- App: **Gmail**
- Trigger event: **New Email**
- Connect your Gmail account and configure any filters (e.g., a specific label).

**2. Add an action step:**

- App: **Webhooks by Zapier**
- Action event: **POST**

**3. Configure the Webhooks action:**

| Field                     | Value                          |
| ------------------------- | ------------------------------ |
| URL                       | `https://inbox.notesnook.com/` |
| Payload Type              | `json`                         |
| Data — `title`            | _(Gmail)_ Subject              |
| Data — `type`             | `note`                         |
| Data — `source`           | `zapier-gmail`                 |
| Data — `version`          | `1`                            |
| Data — `content__type`    | `html`                         |
| Data — `content__data`    | _(Gmail)_ Body HTML            |
| Headers — `Authorization` | `<your-inbox-api-key>`         |

> info
>
> In Zapier's nested JSON syntax, use double underscores (`__`) to represent nested keys. `content__type` maps to `content.type` and `content__data` maps to `content.data` in the JSON body.

**4. Test and activate the Zap.** Zapier will POST a note to your Notesnook inbox for every matching email. The note will appear after your next sync.

---

### IFTTT — Forward emails to Notesnook

This Applet sends any email you forward to your IFTTT trigger address into your Notesnook account as a note.

**1. Create a new Applet:**

- **If this:** Choose the **Email** service → trigger: **Send IFTTT an email**
  - IFTTT gives you a personal trigger address (e.g., `trigger@applet.ifttt.com`). Forward any email there to fire the Applet.

**2. Then that:** choose **Webhooks** → **Make a web request**.

**3. Configure the Webhooks action:**

| Field              | Value                                |
| ------------------ | ------------------------------------ |
| URL                | `https://inbox.notesnook.com/`       |
| Method             | `POST`                               |
| Content Type       | `application/json`                   |
| Additional Headers | `Authorization: <your-inbox-api-key> |
| Body               | _(see below)_                        |

Use the following JSON body template, substituting IFTTT ingredients:

```json
{
  "title": "{{Subject}}",
  "type": "note",
  "source": "ifttt-email",
  "version": 1,
  "content": {
    "type": "html",
    "data": "{{BodyHTML}}"
  }
}
```

**4. Save the Applet.** Any email forwarded to your IFTTT trigger address will be relayed to your Notesnook inbox and appear after the next sync.

## Self-hosting the Inbox API server

Check the self hosting guide [here](/inbox-api/self-hosting-inbox-api.md).

## How it works

Inbox uses OpenPGP asymmetric encryption to ensure your data is encrypted before it ever reaches Notesnook's servers and can only be decrypted on your own devices. The flow is:

1. **When you enable Inbox from settings:**

   - The client generates an OpenPGP public/private keypair (or you provide your own). The public key is stored on Notesnook's servers. The private key is encrypted with your account's master key before being stored. Notesnook never sees it in plaintext.
   - You can now generate API keys for the inbox endpoint. These are short tokens (with a fixed lifetime) you paste into Zapier, IFTTT, or your own code. They tell the inbox server which account to deliver the note to. You can create multiple keys (one per service) and revoke them individually without affecting your account.

2. **When data is posted to the Inbox API:**

   - The inbox server fetches your PGP public key from Notesnook's API using the provided API key.
   - Your payload is encrypted using your PGP public key (`alg: pgp-aes256`). The result is an armored PGP ciphertext blob.
   - The encrypted payload is forwarded to Notesnook's servers and stored in the database. The inbox server never stores your data in plaintext or encrypted. It just acts as a relay.

3. **When your client syncs:**
   - Encrypted inbox items are pushed to all your connected clients (web, desktop, and mobile) via sync.
   - Your device decrypts the payload using your PGP private key (decrypted from the master key on-device) and adds the note to your database.
