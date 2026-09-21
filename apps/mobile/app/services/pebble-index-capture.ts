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
import { AppRegistry, AppState, NativeModules, Platform } from "react-native";
import RNFetchBlob from "react-native-blob-util";
import NetInfo from "@react-native-community/netinfo";
import { getId } from "@notesnook/core";
import { DatabaseLogger, db, setupDatabase } from "../common/database";
import { getCryptoKey, getDatabaseKey } from "../common/database/encryption";
import { writeEncryptedBase64 } from "../common/filesystem/io";
import { useUserStore } from "../stores/use-user-store";
import { NoteBundle } from "../utils/note-bundle";
import { NotesnookModule } from "../utils/notesnook-module";
import SettingsService from "./settings";
import Notifications from "./notifications";

type InboxItem = {
  id: string;
  recordingId?: string;
  transcription?: string;
  recordedAt?: number;
  client?: string;
  trigger?: string;
  payloadMode?: string;
  test?: boolean;
  audioPath?: string;
  audioSize?: number;
  audioMime?: string;
  audioName?: string;
  kind?: string;
  title?: string;
  hasDeadline?: boolean;
  deadlineEpochMs?: number | string;
  deadlineIso?: string;
  notifyBeforeSeconds?: number | string;
  mergedIds?: string[];
};

const processedIds = new Set<string>();
const notesByRecording = new Map<string, string>();
let ingesting = false;
let appStateSub: { remove: () => void } | undefined;

function escapeHtml(text: string): string {
  return text.replace(/[&<>"]/g, (ch) => {
    switch (ch) {
      case "&":
        return "\u0026amp;";
      case "<":
        return "\u0026lt;";
      case ">":
        return "\u0026gt;";
      default:
        return "\u0026quot;";
    }
  });
}

function htmlFromTranscription(text: string): string {
  if (!text) return "";
  const parts = escapeHtml(text).split(/\r\n|\r|\n/);
  return `<p>${parts.join("</p><p>")}</p>`;
}

function titleFor(item: InboxItem): string {
  if (item.title && item.title.trim()) return item.title.trim();
  const when = item.recordedAt
    ? new Date(item.recordedAt).toLocaleString()
    : new Date().toLocaleString();
  if (item.test) return `Index 01 test · ${when}`;
  const firstLine = (item.transcription || "")
    .split("\n")
    .map((line) => line.trim())
    .find(Boolean);
  if (firstLine && firstLine.length < 80) return firstLine;
  return `Index 01 · ${when}`;
}

async function selectedNotebooks(kind?: string): Promise<string[]> {
  const id =
    kind === "reminder"
      ? SettingsService.getProperty("pebbleIndexReminderNotebookId")
      : SettingsService.getProperty("pebbleIndexNotebookId");
  if (!id) return [];
  try {
    const notebook = await db.notebooks.notebook(id);
    if (!notebook) {
      console.warn("PEBBLE INDEX notebook missing, using none", id);
      return [];
    }
    return [id];
  } catch (e) {
    console.warn("PEBBLE INDEX notebook lookup failed", e);
    return [];
  }
}

function ack(id: string) {
  try {
    if (typeof NotesnookModule.ackPebbleIndexCapture === "function") {
      NotesnookModule.ackPebbleIndexCapture(id);
      return;
    }
    NativeModules.NNativeModule?.ackPebbleIndexCapture?.(id);
  } catch (e) {
    console.error("PEBBLE INDEX ACK FAILED", id, e);
  }
}

async function getAttachmentKey(): Promise<{ key?: string; salt?: string }> {
  try {
    const user = await db.user?.getUser?.();
    console.log("PEBBLE INDEX USER", user ? (user as { id?: string }).id : null);
    const key = await db.attachments.generateKey();
    console.log("PEBBLE INDEX KEY from attachments.generateKey");
    return key as { key?: string; salt?: string };
  } catch (e) {
    console.warn("PEBBLE INDEX generateKey failed", String(e));
  }
  const userKey = await getCryptoKey();
  if (userKey) {
    console.log("PEBBLE INDEX KEY from getCryptoKey");
    return { key: userKey as string };
  }
  const dbKey = await getDatabaseKey();
  if (dbKey) {
    console.log("PEBBLE INDEX KEY from getDatabaseKey (offline fallback)");
    return { key: dbKey };
  }
  throw new Error("No encryption key available");
}

async function embedDataUriAudio(
  noteId: string,
  b64: string,
  mime: string,
  name: string,
  sessionId: number
) {
  const note = await db.notes.note(noteId);
  const rawContent = note?.contentId
    ? await db.content.get(note.contentId)
    : null;
  const existing = (rawContent as { data?: string } | null)?.data || "";
  const embed = `<p><audio controls src="data:${mime};base64,${b64}"></audio></p><p><em>${escapeHtml(name)}</em></p>`;
  await db.notes.add({
    id: noteId,
    content: {
      type: "tiptap",
      data: embed + existing
    },
    sessionId
  });
  console.log("PEBBLE INDEX AUDIO DATA-URI EMBEDDED", name, b64.length);
}

async function attachAudioToNote(
  noteId: string,
  item: InboxItem,
  sessionId: number
): Promise<void> {
  if (!item.audioPath) return;
  const src = item.audioPath.replace(/^file:\/\//, "");
  console.log("PEBBLE INDEX ATTACH START", src, item.audioSize);
  const exists = await RNFetchBlob.fs.exists(src);
  if (!exists) {
    throw new Error(`Index audio missing at ${src}`);
  }

  const mime = "audio/mp4";
  let name = item.audioName || `${item.recordingId || item.id}.m4a`;
  if (!/\.m4a$/i.test(name)) name = `${name}.m4a`;
  const size = item.audioSize || 0;
  const b64 = await RNFetchBlob.fs.readFile(src, "base64");
  console.log("PEBBLE INDEX READ B64", b64?.length || 0);

  try {
    const key = await getAttachmentKey();
    console.log("PEBBLE INDEX KEY", !!key?.key);
    const encryptionInfo: any = await writeEncryptedBase64(b64, key, mime);
    encryptionInfo.mimeType = mime;
    encryptionInfo.filename = name;
    encryptionInfo.alg = encryptionInfo.alg || "xcha-stream";
    encryptionInfo.key = key;
    console.log(
      "PEBBLE INDEX ENCRYPTED",
      encryptionInfo.hash,
      encryptionInfo.size
    );

    await db.attachments.add(encryptionInfo, noteId);
    const hash = encryptionInfo.hash;
    if (!hash) throw new Error("encryptFile returned no hash");

    const note = await db.notes.note(noteId);
    const rawContent = note?.contentId
      ? await db.content.get(note.contentId)
      : null;
    const embed = `<audio data-hash="${hash}" data-mime="audio/mp4" data-filename="${escapeHtml(name)}" data-size="${size || encryptionInfo.size || 0}"></audio>`;
    await db.notes.add({
      id: noteId,
      content: {
        type: "tiptap",
        data: embed + ((rawContent as { data?: string } | null)?.data || "")
      },
      sessionId
    });
    console.log("PEBBLE INDEX AUDIO ATTACHED", name, size, hash, mime);
  } catch (e) {
    console.warn("PEBBLE INDEX encrypted attach failed, embedding data URI", e);
    await embedDataUriAudio(noteId, b64, mime, name, sessionId);
  }
}

function parseDeadlineMs(item: InboxItem): number | null {
  if (
    item.hasDeadline === false &&
    item.deadlineEpochMs == null &&
    !item.deadlineIso
  ) {
    return null;
  }
  const epochRaw = item.deadlineEpochMs;
  if (typeof epochRaw === "number" && Number.isFinite(epochRaw) && epochRaw > 0) {
    return Math.trunc(epochRaw);
  }
  if (typeof epochRaw === "string" && epochRaw.trim()) {
    const n = Number(epochRaw);
    if (Number.isFinite(n) && n > 0) return Math.trunc(n);
  }
  if (item.deadlineIso && item.deadlineIso.trim()) {
    const parsed = Date.parse(item.deadlineIso);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

function reminderPriority(): "silent" | "vibrate" | "urgent" {
  const value = SettingsService.getProperty("pebbleIndexReminderPriority");
  if (value === "silent" || value === "vibrate" || value === "urgent") {
    return value;
  }
  return "urgent";
}

async function attachReminderToNote(
  noteId: string,
  item: InboxItem,
  title: string
): Promise<void> {
  const deadlineMs = parseDeadlineMs(item);
  const mode = deadlineMs == null ? "permanent" : "once";
  const priority = reminderPriority();
  try {
    await Notifications.checkAndRequestPermissions(
      AppState.currentState === "active"
    );
  } catch (e) {
    console.warn("PEBBLE INDEX reminder permission", e);
  }
  const reminderId = await db.reminders.add({
    date: deadlineMs ?? Date.now(),
    priority,
    title,
    description: item.transcription && item.transcription !== title
      ? item.transcription
      : undefined,
    mode,
    localOnly: mode === "permanent",
    disabled: false
  });
  if (!reminderId) throw new Error("Failed to create reminder");
  const reminder = await db.reminders.reminder(reminderId);
  if (!reminder) throw new Error("Reminder missing after add");
  await db.relations.add({ id: noteId, type: "note" }, reminder);
  try {
    await Notifications.scheduleNotification(reminder);
    console.log("PEBBLE INDEX REMINDER SCHEDULED", reminderId, mode);
  } catch (e) {
    console.error("PEBBLE INDEX REMINDER NOTIFICATION FAILED", item.id, e);
    DatabaseLogger.error(
      e as Error,
      `PEBBLE INDEX REMINDER NOTIFICATION FAILED ${item.id}`
    );
  }
  console.log(
    "PEBBLE INDEX REMINDER",
    reminderId,
    mode,
    deadlineMs,
    item.deadlineIso,
    priority
  );
}

async function ingestItem(item: InboxItem): Promise<void> {
  const existingNoteId =
    (item.recordingId && notesByRecording.get(item.recordingId)) || undefined;
  const isReminder = item.kind === "reminder";
  const sessionId = Date.now();
  const notebooks = await selectedNotebooks(item.kind);
  const title = titleFor(item);

  const meta: string[] = [];
  if (item.trigger) meta.push(`Trigger: ${item.trigger}`);
  if (item.client) meta.push(`Client: ${item.client}`);
  if (item.recordingId) meta.push(`Recording: ${item.recordingId}`);

  const body =
    htmlFromTranscription(item.transcription || "") +
    (meta.length
      ? `<p></p><p><em>${escapeHtml(meta.join(" · "))}</em></p>`
      : "");

  let noteId = existingNoteId;
  if (!noteId) {
    noteId = getId();
    await NoteBundle.createNotes({
      files: [],
      note: {
        id: noteId,
        title,
        content: {
          type: "tiptap",
          data: body
        },
        sessionId
      },
      notebooks,
      tags: [],
      compress: false
    });
    if (item.recordingId) notesByRecording.set(item.recordingId, noteId);
    console.log(
      "PEBBLE INDEX NOTE CREATED",
      noteId,
      item.id,
      item.kind || "note",
      !!item.audioPath,
      notebooks
    );
  } else {
    if (title) {
      await db.notes.add({
        id: noteId,
        title,
        sessionId
      });
    }
    console.log(
      "PEBBLE INDEX NOTE REUSED",
      noteId,
      item.id,
      item.kind || "note",
      !!item.audioPath
    );
  }

  if (isReminder) {
    try {
      await attachReminderToNote(noteId, item, title);
    } catch (e) {
      console.error("PEBBLE INDEX REMINDER FAILED", item.id, e);
      DatabaseLogger.error(e as Error, `PEBBLE INDEX REMINDER FAILED ${item.id}`);
    }
  }

  if (item.audioPath) {
    try {
      await attachAudioToNote(noteId, item, sessionId);
    } catch (e) {
      console.error("PEBBLE INDEX AUDIO FAILED", item.id, e);
      DatabaseLogger.error(e as Error, `PEBBLE INDEX AUDIO FAILED ${item.id}`);
    }
  } else {
    console.log(
      "PEBBLE INDEX CAPTURE NO AUDIO",
      item.id,
      item.payloadMode,
      item.recordingId
    );
  }
}

function mergeInboxItems(items: InboxItem[]): InboxItem[] {
  const byRecording = new Map<string, InboxItem>();
  const unmatched: InboxItem[] = [];
  for (const item of items) {
    if (!item) continue;
    const key = item.recordingId;
    if (!key) {
      unmatched.push(item);
      continue;
    }
    const existing = byRecording.get(key);
    if (!existing) {
      byRecording.set(key, { ...item });
      continue;
    }
    byRecording.set(key, mergeCaptureItems(existing, item));
  }
  const merged = [...byRecording.values(), ...unmatched];
  if (merged.length === 2) {
    const reminder = merged.find((item) => item.kind === "reminder" && !item.audioPath);
    const audio = merged.find((item) => item.audioPath && item !== reminder);
    if (reminder && audio) {
      console.log(
        "PEBBLE INDEX MERGE PAIR",
        reminder.recordingId,
        audio.recordingId
      );
      return [mergeCaptureItems(audio, reminder)];
    }
  }
  return merged;
}

function mergeCaptureItems(a: InboxItem, b: InboxItem): InboxItem {
  const reminder = a.kind === "reminder" ? a : b.kind === "reminder" ? b : null;
  const withAudio = a.audioPath ? a : b.audioPath ? b : a;
  return {
    ...withAudio,
    id: withAudio.id,
    kind: reminder ? "reminder" : withAudio.kind,
    title: reminder?.title || reminder?.transcription || withAudio.title,
    hasDeadline: reminder?.hasDeadline ?? withAudio.hasDeadline,
    deadlineEpochMs: reminder?.deadlineEpochMs ?? withAudio.deadlineEpochMs,
    deadlineIso: reminder?.deadlineIso ?? withAudio.deadlineIso,
    notifyBeforeSeconds:
      reminder?.notifyBeforeSeconds ?? withAudio.notifyBeforeSeconds,
    transcription: withAudio.transcription || reminder?.transcription,
    audioPath: withAudio.audioPath || reminder?.audioPath,
    audioSize: withAudio.audioSize || reminder?.audioSize,
    audioMime: withAudio.audioMime || reminder?.audioMime,
    audioName: withAudio.audioName || reminder?.audioName,
    mergedIds: [a.id, b.id, ...(a.mergedIds || []), ...(b.mergedIds || [])]
      .filter(Boolean)
      .filter((id, index, all) => all.indexOf(id) === index)
  };
}

async function syncCapture(reason: string): Promise<void> {
  try {
    const user = await db.user?.getUser();
    if (!user) {
      console.log("PEBBLE INDEX SYNC skipped (signed out)", reason);
      return;
    }
    if (SettingsService.get().disableSync) {
      console.log("PEBBLE INDEX SYNC skipped (disabled)", reason);
      return;
    }
    const net = await NetInfo.fetch();
    if (net.isInternetReachable === false) {
      console.log("PEBBLE INDEX SYNC skipped (offline)", reason);
      return;
    }
    const started = Date.now();
    while (useUserStore.getState().syncing && Date.now() - started < 20000) {
      await new Promise((resolve) => setTimeout(resolve, 400));
    }
    console.log("PEBBLE INDEX SYNC start", reason);
    useUserStore.getState().setSyncing(true);
    await db.sync({ type: "send", force: false });
    useUserStore.getState().setSyncing(false);
    console.log("PEBBLE INDEX SYNC done", reason);
  } catch (e) {
    useUserStore.getState().setSyncing(false);
    console.error("PEBBLE INDEX SYNC FAILED", reason, e);
    DatabaseLogger.error(e as Error, `PEBBLE INDEX SYNC FAILED ${reason}`);
  }
}

async function processInbox(raw?: string): Promise<void> {
  if (Platform.OS !== "android") return;
  if (ingesting) {
    console.log("PEBBLE INDEX CAPTURE BUSY");
    return;
  }
  ingesting = true;
  try {
    if (!SettingsService.getProperty("pebbleIndexCapture")) {
      console.log("PEBBLE INDEX CAPTURE DISABLED");
      return;
    }
    if (!db.isInitialized) {
      await setupDatabase();
      await db.init();
    }
    const payload =
      raw || (await NotesnookModule.getPebbleIndexInbox?.()) ||
      (await NativeModules.NNativeModule?.getPebbleIndexInbox?.());
    if (!payload) return;
    const items = mergeInboxItems(JSON.parse(payload) as InboxItem[]);
    console.log("PEBBLE INDEX CAPTURE DRAIN", items.length);
    let ingested = 0;
    for (const item of items) {
      if (!item?.id) continue;
      if (processedIds.has(item.id)) {
        ack(item.id);
        continue;
      }
      try {
        await ingestItem(item);
        ingested += 1;
      } catch (e) {
        console.error("PEBBLE INDEX CAPTURE FAILED", item.id, e);
        DatabaseLogger.error(e as Error, `PEBBLE INDEX CAPTURE FAILED ${item.id}`);
      } finally {
        processedIds.add(item.id);
        ack(item.id);
        for (const extraId of item.mergedIds || []) {
          if (extraId && extraId !== item.id) {
            processedIds.add(extraId);
            ack(extraId);
          }
        }
        console.log("PEBBLE INDEX CAPTURE ACK", item.id, item.mergedIds);
      }
    }
    if (ingested > 0) {
      await syncCapture(`${ingested} capture(s)`);
    }
  } catch (e) {
    console.error("PEBBLE INDEX CAPTURE TASK", e);
    DatabaseLogger.error(e as Error, "PEBBLE INDEX CAPTURE TASK");
  } finally {
    ingesting = false;
  }
}

const onHeadless = async (data: { inbox?: string }) => {
  console.log("PEBBLE INDEX HEADLESS");
  await processInbox(data?.inbox);
};

function safeRegisterHeadlessTask() {
  try {
    if (typeof AppRegistry?.registerHeadlessTask === "function") {
      AppRegistry.registerHeadlessTask(
        "com.streetwriters.notesnook.PEBBLE_INDEX_CAPTURE",
        () => onHeadless
      );
      console.log("PEBBLE INDEX HEADLESS REGISTERED");
      return;
    }
    console.warn("PEBBLE INDEX AppRegistry.registerHeadlessTask missing");
  } catch (e) {
    console.warn("PEBBLE INDEX headless register failed", e);
  }
}

function listenForNativeCapture() {
  try {
    const { DeviceEventEmitter } = require("react-native") as {
      DeviceEventEmitter?: { addListener: Function };
    };
    DeviceEventEmitter?.addListener?.("PEBBLE_INDEX_CAPTURE", (json: string) => {
      processInbox(typeof json === "string" ? json : undefined).catch((e) =>
        console.error("PEBBLE INDEX EVENT", e)
      );
    });
  } catch (e) {
    console.warn("PEBBLE INDEX event listen failed", e);
  }
}

const registerHeadlessTask = () => {
  if (Platform.OS !== "android") return;
  try {
    safeRegisterHeadlessTask();
    listenForNativeCapture();
    if (!appStateSub && AppState?.addEventListener) {
      appStateSub = AppState.addEventListener("change", (state) => {
        if (state === "active") {
          processInbox().catch((e) => console.error("PEBBLE INDEX APPSTATE", e));
        }
      });
    }
    setTimeout(() => {
      processInbox().catch((e) => console.error("PEBBLE INDEX STARTUP", e));
    }, 1500);
  } catch (e) {
    console.error("PEBBLE INDEX REGISTER FAILED", e);
  }
};

const syncNativePrefs = () => {
  if (Platform.OS !== "android") return;
  try {
    NotesnookModule.setPebbleIndexCaptureEnabled?.(
      !!SettingsService.getProperty("pebbleIndexCapture")
    );
    NotesnookModule.setPebbleIndexKeepAlive?.(
      !!SettingsService.getProperty("pebbleIndexKeepAlive")
    );
    const priority =
      SettingsService.getProperty("pebbleIndexReminderPriority") || "urgent";
    NotesnookModule.setPebbleIndexReminderPriority?.(priority);
  } catch {
    /* native module may be unavailable in tests */
  }
};

export const PebbleIndexCapture = {
  registerHeadlessTask,
  syncNativePrefs,
  processInbox
};

export default PebbleIndexCapture;
