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

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { Database } from "@notesnook/core";
import { z } from "zod";

function errorContent(message: string) {
  return { content: [{ type: "text" as const, text: message }], isError: true };
}

export function registerReminderTools(server: McpServer, db: Database): void {
  server.tool("list_reminders", "List all reminders.", {}, async () => {
    const reminders = await db.reminders.all.items();
    return {
      content: [{ type: "text", text: JSON.stringify(reminders, null, 2) }]
    };
  });

  server.tool(
    "create_reminder",
    "Create a new reminder.",
    {
      title: z.string().describe("Reminder title"),
      date: z.number().describe("Due date as Unix timestamp (ms)"),
      description: z.string().optional().describe("Optional description"),
      mode: z
        .enum(["once", "repeat", "permanent"])
        .optional()
        .default("once")
        .describe("Recurrence mode"),
      priority: z
        .enum(["silent", "vibrate", "urgent"])
        .optional()
        .default("vibrate")
        .describe("Notification priority"),
      selectedDays: z
        .array(z.number().int().min(0).max(6))
        .optional()
        .describe("Days of week for repeat mode (0=Sun … 6=Sat)")
    },
    async ({ title, date, description, mode, priority, selectedDays }) => {
      const id = await db.reminders.add({
        title,
        date,
        description,
        mode,
        priority,
        selectedDays
      });
      if (!id) return errorContent("Failed to create reminder");
      const reminder = await db.reminders.reminder(id);
      return {
        content: [
          { type: "text", text: JSON.stringify(reminder ?? { id }, null, 2) }
        ]
      };
    }
  );

  server.tool(
    "update_reminder",
    "Update an existing reminder.",
    {
      id: z.string().describe("Reminder ID"),
      title: z.string().optional().describe("New title"),
      date: z
        .number()
        .optional()
        .describe("New due date as Unix timestamp (ms)"),
      description: z.string().optional(),
      mode: z.enum(["once", "repeat", "permanent"]).optional(),
      priority: z.enum(["silent", "vibrate", "urgent"]).optional(),
      selectedDays: z.array(z.number().int().min(0).max(6)).optional(),
      disabled: z.boolean().optional()
    },
    async ({ id, ...fields }) => {
      await db.reminders.add({ id, ...fields });
      const reminder = await db.reminders.reminder(id);
      return {
        content: [
          { type: "text", text: JSON.stringify(reminder ?? { id }, null, 2) }
        ]
      };
    }
  );

  server.tool(
    "delete_reminder",
    "Delete a reminder by ID.",
    { id: z.string().describe("Reminder ID") },
    async ({ id }) => {
      await db.reminders.remove(id);
      return { content: [{ type: "text", text: `Reminder ${id} deleted.` }] };
    }
  );
}
