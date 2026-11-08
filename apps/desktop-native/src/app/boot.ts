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

import { config, environment, lifecycle } from "@platform";
import { db, initializeDatabase } from "./common/db";
import { initLocale } from "./common/locale";

export type BootState = {
  status: "ready";
  version: string;
  online: boolean;
  user?: { email: string };
};

export type SeedNote = {
  title: string;
  content?: string;
  dateCreated?: number;
  dateEdited?: number;
  favorite?: boolean;
};

export type BootOptions = {
  seed?: SeedNote[];
  resetConfig?: boolean;
};

async function seedNotes(notes: SeedNote[]) {
  for (const note of notes) {
    await db.notes.add({
      title: note.title,
      content: {
        type: "tiptap",
        data: `<p>${note.content ?? note.title}</p>`
      },
      favorite: note.favorite,
      dateCreated: note.dateCreated,
      dateEdited: note.dateEdited
    });
  }
}

export async function boot(options: BootOptions = {}): Promise<BootState> {
  if (environment.isDev && options.resetConfig) config.clear();
  await initLocale();
  await initializeDatabase("db");
  if (environment.isDev && options.seed) await seedNotes(options.seed);
  const user = await db.user.getUser();
  return {
    status: "ready",
    version: environment.version,
    online: await lifecycle.waitForInternet(),
    user: user ? { email: user.email } : undefined
  };
}
