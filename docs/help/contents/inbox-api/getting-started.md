---
title: Getting Started
pageTitle: Getting started with the Notesnook Inbox API
description: Send notes into your Notesnook account from other apps and services with the Inbox API — enabling it, creating keys, and posting your first note.
keywords:
  - notesnook inbox api
  - notesnook api
  - send note to notesnook
  - notesnook zapier
  - notesnook inbox api html
---

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

:::tabs key:platform
== Desktop/Web

1. Go to Settings > Account > Inbox
2. Turn on the `{{enableInboxAPI}}` toggle
3. Choose whether you want to use your own PGP keypair or let Notesnook autogenerate one for you

== Mobile

`Settings > Account > Inbox API > Enable Inbox API`.

:::

::: info
The PGP keys are validated (round-trip encrypt/decrypt) before being saved.

:::

### 2. Create your Inbox API Key

You create your own API keys — none is generated for you when you turn the Inbox API on. You can hold up to **10 keys at a time** and revoke them individually, so each service you connect can have its own.

Each key gets an expiry: `{{expiryOneDay}}`, `{{expiryOneWeek}}`, `{{expiryOneMonth}}` (the default), `{{expiryOneYear}}`, or `{{never}}`.

:::tabs key:platform
== Desktop/Web

1. Go to Settings > Account > Inbox
2. Click `{{createKey}}` in the `{{viewAPIKeys}}` section
3. Set a name for the API Key (e.g. Zapier)
4. Set an expiry date

== Mobile

`Settings > Account > Inbox API > API Keys > Create Key`.

:::

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

::: info Notebook & Tag IDs
Notebook and Tag IDs can be found by right clicking on a notebook/tag and selecting `{{copyId}}`.

:::

#### What HTML can I send?

`content.data` is an HTML string, and `content.type` must be `"html"` — it is the only content format the Inbox API accepts. There is no `"text"` or `"markdown"` type, but you can send plain text with no tags in it at all and it becomes a paragraph.

You don't have to send a fragment. A whole document works too: a `<!doctype>`, `<html>`, `<head>` or `<body>` wrapper is unwrapped for you and only the body content is kept, so you can pipe an email body or a scraped page straight through.

The HTML is sanitized on your own device, after decryption and before the note is saved. Ordinary document markup survives:

- headings, paragraphs, lists, tables, blockquotes and preformatted text
- inline formatting — `<strong>`, `<em>`, `<u>`, `<s>`, `<code>`, `<sub>`, `<sup>`
- links with an `http` or `https` address
- images
- `<iframe>` with a safe `src`, so embeds are not stripped

Anything that could run code is removed, and the surrounding text is kept:

- `<script>` tags and their contents
- inline event handlers — `onclick`, `onerror`, `onmouseover` and the rest
- `javascript:` and `data:` addresses in `href` and `src`
- `<object>`, `<embed>` and `<base>`

::: warning Unbalanced tags turn the whole note into a code block
Your HTML is checked for balanced tags before anything else. An unclosed or mismatched tag anywhere in the payload is **not** repaired — the entire string is escaped and stored as one code block, so the note arrives showing your raw markup instead of formatted text. If a note lands looking like source code, that is why. Close every tag before you post.

:::

Notesnook stores the result in its own editor format, so markup is kept to the extent that it maps onto something the editor can represent. Presentational details that have no equivalent — most inline `style` attributes and layout scaffolding, for example — are dropped, and the text and structure remain.

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

::: info
In Zapier's nested JSON syntax, use double underscores (`__`) to represent nested keys. `content__type` maps to `content.type` and `content__data` maps to `content.data` in the JSON body.

:::

**4. Test and activate the Zap.** Zapier will POST a note to your Notesnook inbox for every matching email. The note will appear after your next sync.

---

### IFTTT — Forward emails to Notesnook

This Applet sends any email you forward to your IFTTT trigger address into your Notesnook account as a note.

**1. Create a new Applet:**

- **If this:** Choose the **Email** service → trigger: **Send IFTTT an email**
  - IFTTT gives you a personal trigger address (e.g., `trigger@applet.ifttt.com`). Forward any email there to fire the Applet.

**2. Then that:** choose **Webhooks** → **Make a web request**.

**3. Configure the Webhooks action:**

| Field              | Value                                 |
| ------------------ | ------------------------------------- |
| URL                | `https://inbox.notesnook.com/`        |
| Method             | `POST`                                |
| Content Type       | `application/json`                    |
| Additional Headers | `Authorization: <your-inbox-api-key>` |
| Body               | _(see below)_                         |

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
   - You can now generate API keys for the inbox endpoint. These are tokens you paste into Zapier, IFTTT, or your own code — each with the expiry you chose, or none at all if you picked `{{never}}`. They tell the inbox server which account to deliver the note to. You can create multiple keys (one per service) and revoke them individually without affecting your account.

2. **When data is posted to the Inbox API:**

   - The inbox server fetches your PGP public key from Notesnook's API using the provided API key.
   - Your payload is encrypted using your PGP public key (`alg: pgp-aes256`). The result is an armored PGP ciphertext blob.
   - The encrypted payload is forwarded to Notesnook's servers and stored in the database. The inbox server never stores your data in plaintext or encrypted. It only acts as a relay.

3. **When your client syncs:**
   - Encrypted inbox items are pushed to all your connected clients (web, desktop, and mobile) via sync.
   - Your device decrypts the payload using your PGP private key (decrypted from the master key on-device) and adds the note to your database.

## When an item fails to arrive

Every item the Inbox API processes is recorded, and anything that fails is kept with the reason it failed — a decryption failure, invalid JSON, or a payload that didn't match the schema, with the offending field named.

:::tabs key:platform
== Desktop/Web

1. Go to `{{settings}}`.
2. Open `{{account}}` > `Inbox`.
3. Next to `{{failedInboxItems}}`, click `{{show}}`.

== Mobile

1. Go to `{{settings}}`.
2. Open `{{account}}` > `{{inboxAPI}}`.
3. Tap `{{failedInboxItems}}`.

:::

You can delete individual entries or clear the whole list. If a service keeps failing, check that `type` is `"note"`, `version` is `1`, and `content.type` is `"html"`.

A note that arrives as a **code block** full of raw markup is not a failure and won't show up in this list — it means the HTML you sent had an unclosed or mismatched tag. See [what HTML can I send?](#what-html-can-i-send).

## Turning the Inbox API off

::: danger Disabling revokes every key
Turning off the Inbox API **deletes all your unsynced inbox items and revokes every API key you have created**. Any service still posting to your inbox will start getting `401 unauthorized`, and you will have to create new keys and update every integration if you turn it back on.

:::

## Related pages

- [Self-hosting the Inbox API](/inbox-api/self-hosting-inbox-api) — running the relay yourself
- [Account settings](/account-settings) — email, password and profile
- [How is my data encrypted?](/how-is-my-data-encrypted) — the encryption behind every note
