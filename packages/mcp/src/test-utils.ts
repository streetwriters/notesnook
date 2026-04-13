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

import { mkdirSync } from "fs";
import { tmpdir } from "os";
import path from "path";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { createDatabase } from "./db.js";
import { PermissionStore } from "./permissions.js";
import { createServer } from "./server.js";

let counter = 0;

export async function makeTestDb() {
  const dir = path.join(
    tmpdir(),
    `notesnook-mcp-test-${process.pid}-${Date.now()}-${counter++}`
  );
  mkdirSync(dir, { recursive: true });
  const db = await createDatabase(dir);
  await db.init();
  return { db, dir };
}

export function makeTestStore(dir: string) {
  return new PermissionStore(dir);
}

/**
 * Creates a full MCP server + in-memory client pair for integration tests.
 * Returns the client (for tool calls), the raw db and store (for direct setup),
 * and the temp dir path (for cleanup).
 */
export async function makeTestServer() {
  const { db, dir } = await makeTestDb();
  const store = makeTestStore(dir);
  const server = createServer(db, store);

  const [clientTransport, serverTransport] =
    InMemoryTransport.createLinkedPair();
  const client = new Client(
    { name: "test-client", version: "1.0.0" },
    { capabilities: {} }
  );

  await server.connect(serverTransport);
  await client.connect(clientTransport);

  return { client, db, store, dir };
}

/**
 * Call a tool via the MCP client and return the text body plus isError flag.
 */
export async function callTool(
  client: Client,
  name: string,
  args: Record<string, unknown> = {}
): Promise<{ text: string; isError: boolean }> {
  const result = await client.callTool({ name, arguments: args });
  const text = (result.content as Array<{ type: string; text: string }>)
    .filter((c) => c.type === "text")
    .map((c) => c.text)
    .join("");
  return { text, isError: (result.isError as boolean) ?? false };
}
