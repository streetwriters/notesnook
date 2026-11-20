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
import { Note } from "@notesnook/core";
import { strings } from "@notesnook/intl";
import { Platform } from "react-native";
import { db } from "../../common/database";
import { NotesnookModule } from "../../utils/notesnook-module";
import { toWidgetNote } from "../pinned-notes-widget";
import { IOSWidgets } from "./ios-widgets";

export type NotesWidgetSourceType =
  | "recent"
  | "pinned"
  | "favorites"
  | "notebook"
  | "tag"
  | "color";

export type NotesWidgetSource = {
  key: string;
  type: NotesWidgetSourceType;
  id?: string;
  title: string;
};

const MAX_NOTES = 30;
const MAX_IOS_SOURCES = 15;
const BUILTIN_TYPES: NotesWidgetSourceType[] = [
  "recent",
  "pinned",
  "favorites"
];

export const createNotesWidgetSource = (
  type: NotesWidgetSourceType,
  title: string,
  id?: string
): NotesWidgetSource => ({
  key: id ? `${type}:${id}` : type,
  type,
  id,
  title
});

export const getBuiltinNotesWidgetSources = (): NotesWidgetSource[] => [
  createNotesWidgetSource("recent", strings.recent()),
  createNotesWidgetSource("pinned", strings.pinned()),
  createNotesWidgetSource(
    "favorites",
    strings.dataTypesPluralCamelCase.favorite()
  )
];

function getSelector(source: NotesWidgetSource) {
  switch (source.type) {
    case "recent":
      return db.notes.all;
    case "pinned":
      return db.notes.pinned;
    case "favorites":
      return db.notes.favorites;
    default:
      return db.relations.from({ id: source.id!, type: source.type }, "note")
        .selector;
  }
}

async function resolveTitle(source: NotesWidgetSource) {
  switch (source.type) {
    case "notebook":
      return (await db.notebooks.notebook(source.id!))?.title;
    case "tag":
      return (await db.tags.tag(source.id!))?.title;
    case "color":
      return (await db.colors.color(source.id!))?.title;
    default:
      return source.title;
  }
}

function getSortOptions(source: NotesWidgetSource) {
  switch (source.type) {
    case "favorites":
      return db.settings.getGroupOptions("favorites");
    case "notebook":
    case "tag":
    case "color":
      return db.settings.getGroupOptionsById(source.id!, source.type);
    default:
      return db.settings.getGroupOptions("home");
  }
}

async function fetchNotes(source: NotesWidgetSource) {
  const isRecent = source.type === "recent";
  const skipped = isRecent
    ? (await db.notes.pinned.count()) + (await db.notes.conflicted.count())
    : 0;

  let notes = (await getSelector(source)
    .limit(MAX_NOTES + skipped)
    .items(undefined, getSortOptions(source))) as Note[];

  if (isRecent) {
    notes = notes.filter((note) => !note.pinned && !note.conflicted);
  }
  return notes
    .filter((note) => !note.dateDeleted)
    .slice(0, MAX_NOTES)
    .map(toWidgetNote);
}

async function updateIOS() {
  const stored = IOSWidgets.read<NotesWidgetSource[]>("widgetSources", []);
  const sources = getBuiltinNotesWidgetSources();

  for (const source of stored) {
    if (BUILTIN_TYPES.includes(source.type)) continue;
    const title = await resolveTitle(source);
    if (title === undefined) continue;
    sources.push({ ...source, title });
  }

  for (const source of sources) {
    IOSWidgets.write(`notes.${source.key}`, await fetchNotes(source));
  }
  IOSWidgets.publish("widgetSources", sources, ["NotesListWidget"]);
}

async function updateAndroid() {
  const configured = (await NotesnookModule.getNotesWidgetSources())
    .map((data) => {
      try {
        return JSON.parse(data) as NotesWidgetSource;
      } catch {
        return undefined;
      }
    })
    .filter((source): source is NotesWidgetSource => !!source);

  const sources = new Map<string, NotesWidgetSource>();
  sources.set("recent", getBuiltinNotesWidgetSources()[0]);
  for (const source of configured) sources.set(source.key, source);

  for (const source of sources.values()) {
    const title = await resolveTitle(source);
    const notes = title === undefined ? [] : await fetchNotes(source);
    if (title !== undefined) {
      NotesnookModule.setString(
        "appPreview",
        `notesWidget.title.${source.key}`,
        title
      );
    }
    NotesnookModule.setString(
      "appPreview",
      `notesWidget.notes.${source.key}`,
      JSON.stringify(notes)
    );
  }
  NotesnookModule.updateNotesWidget();
}

let timer: NodeJS.Timeout;

export const NotesWidget = {
  updateNotes: () => {
    if (Platform.OS !== "android" && Platform.OS !== "ios") return;
    clearTimeout(timer);
    timer = setTimeout(async () => {
      try {
        if (Platform.OS === "ios") await updateIOS();
        else await updateAndroid();
      } catch (err) {
        console.error("Failed to update notes widget:", err);
      }
    }, 500);
  },

  addSource: (source: NotesWidgetSource) => {
    if (Platform.OS !== "ios") return;
    const stored = IOSWidgets.read<NotesWidgetSource[]>("widgetSources", []);
    const sources = [
      ...stored.filter((item) => item.key !== source.key),
      source
    ].slice(-MAX_IOS_SOURCES);
    IOSWidgets.write("widgetSources", sources);
    NotesWidget.updateNotes();
  },

  chooseSource: (source: NotesWidgetSource, slot?: string) => {
    if (Platform.OS !== "ios") return;
    if (!BUILTIN_TYPES.includes(source.type)) NotesWidget.addSource(source);
    if (slot) {
      const slots = IOSWidgets.read<Record<string, string>>(
        "widgetSlotSources",
        {}
      );
      IOSWidgets.write("widgetSlotSources", { ...slots, [slot]: source.key });
    }
    NotesWidget.updateNotes();
  },

  configure: (widgetId: number, source: NotesWidgetSource) => {
    if (Platform.OS !== "android") return;
    NotesnookModule.setString(
      "appPreview",
      `notesWidget.config.${widgetId}`,
      JSON.stringify(source)
    );
    NotesWidget.updateNotes();
  }
};
