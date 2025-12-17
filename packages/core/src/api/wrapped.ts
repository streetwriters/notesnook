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

import { Parser } from "htmlparser2";
import Database from "./index.js";
import { countWords } from "alfaaz";
import { DatabaseSchema, isFalse } from "../database/index.js";
import { SelectQueryBuilder } from "@streetwriters/kysely";

const dayNames = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday"
];

const monthNames = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December"
];

export type NoteStats = {
  totalNotes: number;
  totalWords: number;
  totalMonographs: number;
  mostNotesCreatedInMonth: { month: string; count: number } | null;
  mostNotesCreatedInDay: { day: string; count: number } | null;
  monthlyStats: Record<string, number>;
  dayOfWeekStats: Record<string, number>;
  largestNote: { title: string; length: number } | null;
};

export type OrganizationStats = {
  totalNotebooks: number;
  totalTags: number;
  mostUsedTags: { id: string; title: string; noteCount: number }[];
  mostActiveNotebooks: { id: string; title: string; noteCount: number }[];
  totalColors: number;
};

export type AttachmentStats = {
  totalAttachments: number;
  totalStorageUsed: number;
  largestAttachment: { id: string; filename: string; size: number } | null;
  mostCommonFileType: string | null;
};

export type WrappedStats = NoteStats & OrganizationStats & AttachmentStats;

export class Wrapped {
  constructor(private readonly db: Database) {}

  async get(): Promise<WrappedStats> {
    const { startDate, endDate } = this.getYearRange();

    const [noteStats, organizationStats, attachmentStats] = await Promise.all([
      this.getNoteStats(startDate, endDate),
      this.getOrganizationStats(startDate, endDate),
      this.getAttachmentStats(startDate, endDate)
    ]);

    return {
      ...noteStats,
      ...organizationStats,
      ...attachmentStats
    };
  }

  private getYearRange(): { startDate: number; endDate: number } {
    const year = new Date().getFullYear();
    const startDate = new Date(year, 0, 1, 0, 0, 0, 0).getTime();
    const endDate = new Date(year + 1, 0, 1, 0, 0, 0, 0).getTime();
    return { startDate, endDate };
  }

  private async getNoteStats(
    startDate: number,
    endDate: number
  ): Promise<NoteStats> {
    const notesSelector = this.db
      .sql()
      .selectFrom("notes")
      .where((eb) => eb("dateCreated", ">=", startDate))
      .where((eb) => eb("dateCreated", "<", endDate))
      .where(isFalse("deleted"))
      .where(isFalse("dateDeleted"));
    const notes = await notesSelector.select(["notes.dateCreated"]).execute();

    const monthlyStats: Map<string, number> = new Map();
    const dayOfWeekStats: Map<string, number> = new Map();
    let totalNotes = 0;

    for (const note of notes) {
      if (!note.dateCreated) continue;

      totalNotes++;
      const month = new Date(note.dateCreated).getMonth();
      const monthName = monthNames[month];
      monthlyStats.set(monthName, (monthlyStats.get(monthName) || 0) + 1);
      const dayOfWeek = new Date(note.dateCreated).getDay();
      const dayName = dayNames[dayOfWeek];
      dayOfWeekStats.set(dayName, (dayOfWeekStats.get(dayName) || 0) + 1);
    }

    let mostNotesCreatedInMonth: NoteStats["mostNotesCreatedInMonth"] = null;
    for (const [month, count] of monthlyStats.entries()) {
      if (!mostNotesCreatedInMonth || count > mostNotesCreatedInMonth.count) {
        mostNotesCreatedInMonth = { month, count };
      }
    }

    let mostNotesCreatedInDay: NoteStats["mostNotesCreatedInDay"] = null;
    let maxDayCount = 0;
    for (const [day, count] of dayOfWeekStats.entries()) {
      if (count > maxDayCount) {
        maxDayCount = count;
        mostNotesCreatedInDay = { day, count };
      }
    }

    const totalMonographs = await this.db.monographs.all
      .where((eb) =>
        eb.and([
          eb("dateCreated", ">=", startDate),
          eb("dateCreated", "<", endDate)
        ])
      )
      .count();

    const { largestNote, totalWords } = await this.countTotalWords(
      notesSelector
    );

    return {
      totalNotes,
      totalWords,
      totalMonographs,
      largestNote: largestNote
        ? {
            title: (await this.db.notes.note(largestNote.id))?.title || "",
            length: largestNote.wordCount
          }
        : null,
      monthlyStats: Object.fromEntries(monthlyStats),
      dayOfWeekStats: Object.fromEntries(dayOfWeekStats),
      mostNotesCreatedInMonth,
      mostNotesCreatedInDay
    };
  }

  private async countItemNotes<T extends { id: string; title: string }>(
    items: T[],
    itemType: "tag" | "notebook"
  ): Promise<Array<T & { noteCount: number }>> {
    const allRelations = await this.db.relations
      .from({ ids: items.map((item) => item.id), type: itemType }, "note")
      .get();

    const noteCounts: Map<string, number> = new Map();
    for (const relation of allRelations) {
      const itemId = relation.fromId;
      noteCounts.set(itemId, (noteCounts.get(itemId) || 0) + 1);
    }

    return items
      .map((item) => ({
        ...item,
        noteCount: noteCounts.get(item.id) || 0
      }))
      .filter((item) => item.noteCount > 0)
      .sort((a, b) => b.noteCount - a.noteCount);
  }

  private async getOrganizationStats(
    startDate: number,
    endDate: number
  ): Promise<OrganizationStats> {
    const notebookSelector = this.db.notebooks.all
      .where((eb) => eb("dateCreated", ">=", startDate))
      .where((eb) => eb("dateCreated", "<", endDate));
    const tagSelector = this.db.tags.all
      .where((eb) => eb("dateCreated", ">=", startDate))
      .where((eb) => eb("dateCreated", "<", endDate));

    const [totalNotebooks, totalTags, tags, notebooks, totalColors] =
      await Promise.all([
        notebookSelector.count(),
        tagSelector.count(),
        tagSelector.fields(["tags.id", "tags.title"]).items(),
        notebookSelector.fields(["notebooks.id", "notebooks.title"]).items(),
        this.db.colors.all
          .where((eb) => eb("dateCreated", ">=", startDate))
          .where((eb) => eb("dateCreated", "<", endDate))
          .count()
      ]);

    const tagNotes = await this.countItemNotes(tags, "tag");
    const mostUsedTags = tagNotes.slice(0, 3);

    const notebookNotes = await this.countItemNotes(notebooks, "notebook");
    const mostActiveNotebooks = notebookNotes.slice(0, 3);

    return {
      totalNotebooks,
      totalTags,
      mostUsedTags:
        mostUsedTags.length > 0
          ? mostUsedTags
          : tags.slice(0, 3).map((tag) => ({ ...tag, noteCount: 0 })),
      mostActiveNotebooks:
        mostActiveNotebooks.length > 0
          ? mostActiveNotebooks
          : notebooks.slice(0, 3).map((n) => ({ ...n, noteCount: 0 })),
      totalColors
    };
  }

  private async getAttachmentStats(
    startDate: number,
    endDate: number
  ): Promise<AttachmentStats> {
    const attachmentsSelector = this.db.attachments.all
      .where((eb) => eb("dateCreated", ">=", startDate))
      .where((eb) => eb("dateCreated", "<", endDate));
    const totalAttachments = await attachmentsSelector.count();

    if (totalAttachments === 0) {
      return {
        totalAttachments: 0,
        totalStorageUsed: 0,
        largestAttachment: null,
        mostCommonFileType: null
      };
    }

    const totalStorageUsed =
      (await this.db.attachments.totalSize(attachmentsSelector)) || 0;
    const attachments = await attachmentsSelector.items();
    let largestAttachment: AttachmentStats["largestAttachment"] = null;
    const mimeTypeCounts: Map<string, number> = new Map();

    for (const attachment of attachments) {
      if (!largestAttachment || attachment.size > largestAttachment.size) {
        largestAttachment = {
          id: attachment.id,
          filename: attachment.filename,
          size: attachment.size
        };
      }

      const mimeType = attachment.mimeType.split("/")[0] || attachment.mimeType;
      mimeTypeCounts.set(mimeType, (mimeTypeCounts.get(mimeType) || 0) + 1);
    }

    let mostCommonFileType: string | null = null;
    let maxCount = 0;
    for (const [mimeType, count] of mimeTypeCounts.entries()) {
      if (count > maxCount) {
        maxCount = count;
        mostCommonFileType = mimeType;
      }
    }

    return {
      totalAttachments,
      totalStorageUsed,
      largestAttachment,
      mostCommonFileType
    };
  }

  private async countTotalWords(
    selector: SelectQueryBuilder<DatabaseSchema, "notes", unknown>
  ) {
    let words = 0;
    let largestNote = { id: "", wordCount: 0 };
    const contents = await this.db
      .sql()
      .selectFrom("content")
      .where("noteId", "in", selector.select("id"))
      .where(isFalse("locked"))
      .where(isFalse("deleted"))
      .select(["content.data", "content.noteId"])
      .execute();

    for (const content of contents) {
      if (typeof content?.data !== "string") continue;
      const counted = countWords(toTextContent(content.data));
      words += counted;
      if (content.noteId && counted > largestNote.wordCount) {
        largestNote = { id: content.noteId, wordCount: counted };
      }
    }

    return { totalWords: words, largestNote };
  }
}

function toTextContent(html: string) {
  let text = "";

  const parser = new Parser({
    ontext: (data) => {
      text += data;
    },
    onclosetag() {
      text += " ";
    }
  });
  parser.write(html);
  parser.end();
  return text;
}
