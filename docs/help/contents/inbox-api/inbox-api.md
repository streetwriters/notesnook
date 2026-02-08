---
title: Inbox API 
description: Learn about Notesnook's Inbox API.
---

# Inbox API

Notesnook's Inbox API allows a user to send data to their NN account from third party services. The inbox server exposes a public endpoint which accepts data, encrypts it, and adds it to the user's Notesnook account.

## When to use Inbox API

It is up to the user to decide when to use the Inbox API. Some common use-cases include:
- Setting up a Zapier automation to send inbound emails to Notesnook as notes.
- Integrating to a custom server.
- Automating sending data from other apps to Noetesnook.

## How to use Inbox API

### 1. Enable Inbox API from settings.

# [Desktop/Web](#/tab/web)

`Settings > Inbox > Enable Inbox API`.

---

### 2. Get your Inbox API Key.

One API key should be created by default. You can create multiple API keys if needed.

# [Desktop/Web](#/tab/web)

`Settings > Inbox > Create Key`.

---

### 3. Post data to Inbox API endpoint.

**Endpoint**: `POST https://inbox.notesnook.com/`

#### Headers

| Header | Type | Status | Description |
|--------|------|--------|-------------|
| `Content-Type` | string | **Required** | Must be `application/json` |
| `Authorization` | string | **Required** | Your inbox API key |

#### Request Body

| Field | Type | Status | Description |
|-------|------|--------|-------------|
| `title` | string | **Required** | Title. Minimum 1 character. |
| `type` | string | **Required** | Entity type. Currently only `"note"` supported. |
| `source` | string | **Required** | Source identifier (e.g., `"Zapier"`, `"Custom App"`). |
| `version` | number | **Required** | Schema version. Currently `1`. |
| `content` | object | Optional | Note content object |
| `content.type` | string | **Required** (if content provided) | Content format. Currently only `"html"` supported. |
| `content.data` | string | **Required** (if content provided) | HTML content as a string. |
| `pinned` | boolean | Optional | Pin the note. Default: `false`. |
| `favorite` | boolean | Optional | Mark as favorite. Default: `false`. |
| `readonly` | boolean | Optional | Make note read-only. Default: `false`. |
| `archived` | boolean | Optional | Archive the note. Default: `false`. |
| `notebookIds` | string[] | Optional | Array of notebook IDs to assign note to. |
| `tagIds` | string[] | Optional | Array of tag IDs to apply to note. |

#### Response

On success, the API returns a `200 OK` status.

On failure, appropriate HTTP status codes (4xx, 5xx) are returned with error details.

#### Example Request

```bash
curl -X POST https://inbox.notesnook.com/ \
  -H "Content-Type: application/json" \
  -H "Authorization: <your-inbox-api-key-here>" \
  -d '{
    "title": "My Important Note",
    "type": "note",
    "source": "zapier-email-forwarding",
    "version": 1,
    "content": {
      "type": "html",
      "data": "<h1>Meeting Notes</h1><p>Discussed Q4 roadmap</p>"
    },
    "favorite": true,
    "tagIds": ["67aecf3b9e1398484554bc90"]
  }'
```

> info
>
> Notebook and Tag IDs can be found by right-clicking on a notebook/tag and selecting `Copy ID`.

## How it works

Inbox uses a hybrid symmetric and asymmetric encryption (public/private key pairs) scheme to ensure all data is encrypted on the inbox server and decrypted on the user's clients (web or desktop, mobile isn't supported yet). The flow looks like this:

1. When user enables inbox from the settings:
    - The client generates a public/private encryption key pair. The public key is stored as-is on NN's servers. The private key is encrypted again with the user's encryption key and then stored on server.
    - User is also now able to generate API keys for the inbox endpoint. The API keys allow NN to authenticate the user for the inbox API.
2. When user sends data to the inbox API:
    - The inbox endpoint is served from an inbox server separate from NN's servers. The data is encrypted using a random key. The random key itself is encrypted using the user's inbox public key. The entire payload is sent to the NN's servers where it is stored in the database.
3. The inbox data is then synced to the web or desktop app. Using the private key, the data is decrypted on the client and then pushed into the user's database.
