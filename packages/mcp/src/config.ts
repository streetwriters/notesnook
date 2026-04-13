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

export interface Config {
  email: string;
  password: string;
  /** Base32 TOTP secret — required only when the account has 2FA (app) enabled. */
  totpSecret?: string;
  dataDir: string;
}

export function loadConfig(dataDir: string): Config {
  const email = process.env.NOTESNOOK_EMAIL;
  const password = process.env.NOTESNOOK_PASSWORD;

  const missing: string[] = [];
  if (!email) missing.push("NOTESNOOK_EMAIL");
  if (!password) missing.push("NOTESNOOK_PASSWORD");

  if (missing.length > 0) {
    process.stderr.write(
      `Error: Missing required environment variable(s): ${missing.join(
        ", "
      )}\n` +
        `Set them before starting the MCP server:\n` +
        `  NOTESNOOK_EMAIL=user@example.com NOTESNOOK_PASSWORD=secret notesnook-mcp\n`
    );
    process.exit(1);
  }

  return {
    email: email as string,
    password: password as string,
    totpSecret: process.env.NOTESNOOK_TOTP_SECRET,
    dataDir
  };
}
