/*
This file is part of the Notesnook project (https://notesnook.com/)

Copyright (C) 2023 Streetwriters (Private) Limited

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

import { createHmac } from "crypto";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { loadConfig } from "./config.js";
import { createDatabase, getDataDir } from "./db.js";
import { PermissionStore } from "./permissions.js";
import { createServer } from "./server.js";
import { startSync } from "./sync.js";

async function main() {
  // Core uses NODE_ENV to choose between production and local-dev API hosts.
  // Default to production so the server talks to app.notesnook.com, not localhost.
  if (!process.env.NODE_ENV) process.env.NODE_ENV = "production";

  process.stderr.write("Notesnook MCP Server starting...\n");

  const dataDir = getDataDir();
  const config = loadConfig(dataDir);

  const db = await createDatabase(dataDir);
  await db.init();
  process.stderr.write("Database initialized.\n");

  const existingUser = await db.user.getUser();
  if (existingUser) {
    process.stderr.write(`Resuming session for ${existingUser.email}\n`);
  } else {
    await authenticate(db, config.email, config.password);
  }

  startSync(db);

  const store = new PermissionStore(dataDir);
  const server = createServer(db, store);

  // Graceful shutdown: flush pending writes before exiting
  async function shutdown() {
    process.stderr.write("Shutting down...\n");
    try {
      await db.sync({ type: "send" });
    } catch {
      // best-effort
    }
    process.exit(0);
  }
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);

  const transport = new StdioServerTransport();
  await server.connect(transport);
  process.stderr.write("MCP server connected on stdio.\n");
}

async function authenticate(
  db: Awaited<ReturnType<typeof createDatabase>>,
  email: string,
  password: string
) {
  try {
    const mfaInfo = await db.user.authenticateEmail(email);
    if (mfaInfo) {
      const method = (mfaInfo as { primaryMethod?: string }).primaryMethod;
      if (method !== "app") {
        process.stderr.write(
          `Authentication requires MFA method "${method ?? "unknown"}".\n` +
            `Only authenticator app (TOTP) is supported. Set NOTESNOOK_TOTP_SECRET and retry.\n`
        );
        process.exit(1);
      }
      const totpSecret = process.env.NOTESNOOK_TOTP_SECRET;
      if (!totpSecret) {
        process.stderr.write(
          `Authentication requires an authenticator app (TOTP).\n` +
            `Set NOTESNOOK_TOTP_SECRET to your base32 TOTP secret and retry.\n`
        );
        process.exit(1);
      }
      const code = generateTOTP(totpSecret);
      process.stderr.write(`Submitting TOTP code for MFA...\n`);
      await db.user.authenticateMultiFactorCode(code, "app");
    }
    await db.user.authenticatePassword(email, password);
    process.stderr.write(`Authenticated as ${email}\n`);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    process.stderr.write(`Authentication failed: ${message}\n`);
    process.exit(1);
  }
}

/**
 * Generates the current TOTP code (RFC 6238) from a base32 secret.
 * Uses a 30-second window and SHA-1, matching Google Authenticator.
 */
function generateTOTP(base32Secret: string): string {
  // Decode base32 (RFC 4648 alphabet, case-insensitive, ignore padding)
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  const cleaned = base32Secret.toUpperCase().replace(/=+$/, "");
  let bits = 0;
  let value = 0;
  const bytes: number[] = [];
  for (const char of cleaned) {
    const idx = alphabet.indexOf(char);
    if (idx === -1) continue;
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }
  const key = Buffer.from(bytes);

  // HOTP counter = floor(unix_time / 30)
  const counter = Math.floor(Date.now() / 1000 / 30);
  const counterBuf = Buffer.alloc(8);
  // Write 64-bit big-endian counter (JS numbers are safe up to 2^53)
  counterBuf.writeUInt32BE(Math.floor(counter / 0x100000000), 0);
  counterBuf.writeUInt32BE(counter >>> 0, 4);

  const hmac = createHmac("sha1", key).update(counterBuf).digest();
  const offset = hmac[hmac.length - 1] & 0x0f;
  const otp =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);

  return String(otp % 1_000_000).padStart(6, "0");
}

main().catch((err) => {
  process.stderr.write(`Fatal: ${err}\n`);
  process.exit(1);
});
