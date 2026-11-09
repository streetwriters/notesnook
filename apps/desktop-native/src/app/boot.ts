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

import { config, environment, history, lifecycle } from "@platform";
import { db, initializeDatabase } from "./common/db";
import { initLocaleSync } from "./common/locale";
import { getCurrentPath } from "./navigation";
import { DEFAULT_ITERATIONS, useKeyStore } from "./interfaces/key-store";
import { randomBytes } from "./interfaces/subtle";
import { setDatabaseFailed, setDatabaseReady } from "./stores/boot-store";
import Config from "./utils/config";
import { logStartup } from "./utils/startup";

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
  pinned?: boolean;
  archived?: boolean;
  trashed?: boolean;
  color?: string;
  tags?: string[];
};

export type SeedReminder = {
  title: string;
  description?: string;
  date?: number;
  mode?: "once" | "repeat" | "permanent";
  recurringMode?: "day" | "week" | "month" | "year";
  selectedDays?: number[];
  priority?: "silent" | "vibrate" | "urgent";
  disabled?: boolean;
};

export type SeedNotebook = { title: string; children?: SeedNotebook[] };

export type BootOptions = {
  seed?: SeedNote[];
  seedNotebooks?: SeedNotebook[];
  seedTags?: { title: string }[];
  seedColors?: { title: string; colorCode: string }[];
  seedReminders?: SeedReminder[];
  softAuthenticatorPin?: string;
  seedAppLockPassword?: string;
  seedAppLockSecurityKey?: boolean;
  seedUser?: { email?: string; plan?: "free" | "pro" };
  resetConfig?: boolean;
  delayDatabaseMs?: number;
  initialPath?: string;
  initialHash?: string;
};

async function ensureTag(title: string) {
  const existing = await db.tags.find(title);
  return existing ? existing.id : await db.tags.add({ title });
}

async function seedOthers(options: BootOptions) {
  const addNotebook = async (notebook: SeedNotebook, parentId?: string) => {
    const id = await db.notebooks.add({ title: notebook.title });
    await new Promise((resolve) => setTimeout(resolve, 5));
    if (!id) return;
    if (parentId)
      await db.relations.add(
        { type: "notebook", id: parentId },
        { type: "notebook", id }
      );
    for (const child of notebook.children ?? []) await addNotebook(child, id);
  };
  for (const notebook of options.seedNotebooks ?? [])
    await addNotebook(notebook);
  for (const tag of options.seedTags ?? []) await ensureTag(tag.title);
  for (const color of options.seedColors ?? [])
    await db.colors.add({ title: color.title, colorCode: color.colorCode });
  for (const reminder of options.seedReminders ?? [])
    await db.reminders.add({
      title: reminder.title,
      description: reminder.description,
      date: reminder.date ?? Date.now() + 24 * 60 * 60 * 1000,
      mode: reminder.mode ?? "once",
      recurringMode: reminder.recurringMode,
      selectedDays: reminder.selectedDays ?? [],
      priority: reminder.priority ?? "vibrate",
      disabled: reminder.disabled ?? false
    });
}

async function seedNotes(notes: SeedNote[]) {
  for (const note of notes) {
    const id = await db.notes.add({
      title: note.title,
      content: {
        type: "tiptap",
        data: `<p>${note.content ?? note.title}</p>`
      },
      favorite: note.favorite,
      dateCreated: note.dateCreated,
      dateEdited: note.dateEdited
    });
    if (!id) continue;
    if (note.pinned) await db.notes.pin(true, id);
    if (note.archived) await db.notes.archive(true, id);
    for (const title of note.tags ?? []) {
      const tagId = await ensureTag(title);
      if (tagId)
        await db.relations.add(
          { type: "tag", id: tagId },
          { type: "note", id }
        );
    }
    if (note.color) {
      const colorId = await db.colors.add({
        title: note.color,
        colorCode: note.color
      });
      if (colorId)
        await db.relations.add(
          { type: "color", id: colorId },
          { type: "note", id }
        );
    }
    if (note.trashed) await db.notes.moveToTrash(id);
  }
}

async function seedAppLock(options: BootOptions) {
  const store = useKeyStore.getState();
  await store.init({ persistence: "db" });
  if (options.seedAppLockPassword) {
    const credential = { type: "password", id: "password" } as const;
    await store.register({
      ...credential,
      salt: randomBytes(16),
      iterations: DEFAULT_ITERATIONS
    });
    await store.activate({
      ...credential,
      password: options.seedAppLockPassword
    });
  }
  if (options.seedAppLockSecurityKey) {
    const credential = {
      type: "securityKey",
      id: "securityKey",
      config: {
        firstSalt: new Uint8Array(32),
        label: "Security key",
        rawId: new Uint8Array(16).buffer,
        transports: [] as string[]
      }
    } as const;
    await store.register(credential);
    await (
      store as unknown as {
        update: (
          query: { type: "securityKey"; id: string },
          patch: (c: { active?: boolean }) => void
        ) => Promise<void>;
      }
    ).update(credential, (c) => {
      c.active = true;
    });
  }
  store.relock();
}

async function seedUser(options: NonNullable<BootOptions["seedUser"]>) {
  const now = Date.now();
  await db.user.setUser({
    id: "e2e-user",
    email: options.email ?? "e2e@example.com",
    isEmailConfirmed: true,
    mfa: {
      isEnabled: false,
      primaryMethod: "email",
      remainingValidCodes: 0
    },
    subscription: {
      appId: 0,
      cancelURL: null,
      expiry: now + 365 * 24 * 60 * 60 * 1000,
      productId: null,
      provider: 0,
      start: now,
      plan: options.plan === "free" ? 0 : 2,
      status: 0,
      updateURL: null,
      googlePurchaseToken: null
    }
  } as unknown as Parameters<typeof db.user.setUser>[0]);
}

async function installSoftAuthenticator(pin: string) {
  const webauthn = await import("@react-native-gpui/webauthn");
  await webauthn.installSoftAuthenticator(pin);
}

export function prepareBoot(options: BootOptions) {
  if (environment.isDev && options.resetConfig) config.clear();
  if (environment.isDev && (options.initialPath || options.initialHash))
    history.replace({
      path: options.initialPath ?? getCurrentPath(),
      hash: options.initialHash ?? "",
      search: ""
    });
  initLocaleSync();
}

async function run(options: BootOptions) {
  if (environment.isDev && options.delayDatabaseMs)
    await new Promise((resolve) =>
      setTimeout(resolve, options.delayDatabaseMs)
    );
  await initializeDatabase(
    getCurrentPath().startsWith("/account/recovery") ? "memory" : "db"
  );
  if (environment.isDev && options.seed) await seedNotes(options.seed);
  if (environment.isDev) await seedOthers(options);
  if (environment.isDev && options.seedUser) await seedUser(options.seedUser);
  if (environment.isDev && options.softAuthenticatorPin)
    await installSoftAuthenticator(options.softAuthenticatorPin);
  if (
    environment.isDev &&
    (options.seedAppLockPassword || options.seedAppLockSecurityKey)
  )
    await seedAppLock(options);
  const user = await db.user.getUser();
  Config.set("isLoggedIn", !!user);
  return {
    status: "ready",
    version: environment.version,
    online: await lifecycle.waitForInternet(),
    user: user ? { email: user.email } : undefined
  } satisfies BootState;
}

export async function boot(options: BootOptions = {}): Promise<void> {
  try {
    const { status: _status, ...state } = await run(options);
    logStartup("database ready");
    setDatabaseReady(state);
  } catch (e) {
    setDatabaseFailed(e instanceof Error ? e.message : String(e));
  }
}
