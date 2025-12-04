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

import {
  WrappedStats,
  NoteStats,
  AttachmentStats,
  OrganizationStats
} from "../types.js";
import Database from "./index.js";

const dayNames = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday"
];

export class Wrapped {
  year = 2025;

  constructor(private readonly db: Database) {}

  async get(): Promise<WrappedStats> {
    const { startDate, endDate } = this.getYearRange(this.year);

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

  private getYearRange(year: number): { startDate: number; endDate: number } {
    const startDate = new Date(year, 0, 1, 0, 0, 0, 0).getTime();
    const endDate = new Date(year + 1, 0, 1, 0, 0, 0, 0).getTime();
    return { startDate, endDate };
  }

  private async getNoteStats(
    startDate: number,
    endDate: number
  ): Promise<NoteStats> {
    const notesSelector = this.db.notes.all
      .where((eb) => eb("dateCreated", ">=", startDate))
      .where((eb) => eb("dateCreated", "<", endDate));

    const totalNotes = await notesSelector.count();

    if (totalNotes === 0) {
      return {
        noteIds: [],
        totalNotes: 0,
        mostNotesCreatedInMonth: null,
        mostNotesCreatedInDay: null,
        noteWithMostEdits: null
      };
    }

    const notes = await notesSelector.items();
    const monthlyStats: Map<number, number> = new Map();
    const dayOfWeekStats: Map<string, number> = new Map();
    let noteWithMostEdits: NoteStats["noteWithMostEdits"] = null;

    for (const note of notes) {
      const month = new Date(note.dateCreated).getMonth();
      monthlyStats.set(month, (monthlyStats.get(month) || 0) + 1);
      const dayOfWeek = new Date(note.dateCreated).getDay();
      const dayName = dayNames[dayOfWeek];
      dayOfWeekStats.set(dayName, (dayOfWeekStats.get(dayName) || 0) + 1);

      try {
        const sessions = this.db.noteHistory.get(note.id);
        if (sessions) {
          const revisionCount = await sessions
            .where((eb) => eb("dateCreated", ">=", startDate))
            .where((eb) => eb("dateCreated", "<", endDate))
            .count();

          if (
            !noteWithMostEdits ||
            revisionCount > noteWithMostEdits.editCount
          ) {
            noteWithMostEdits = {
              id: note.id,
              title: note.title,
              editCount: revisionCount
            };
          }
        }
      } catch {}
    }

    let mostNotesCreatedInMonth: { month: number; count: number } | null = null;
    for (const [month, count] of monthlyStats.entries()) {
      if (!mostNotesCreatedInMonth || count > mostNotesCreatedInMonth.count) {
        mostNotesCreatedInMonth = { month, count };
      }
    }

    let mostNotesCreatedInDay: string | null = null;
    let maxDayCount = 0;
    for (const [day, count] of dayOfWeekStats.entries()) {
      if (count > maxDayCount) {
        maxDayCount = count;
        mostNotesCreatedInDay = day;
      }
    }

    return {
      noteIds: notes.map((note) => note.id),
      totalNotes,
      mostNotesCreatedInMonth,
      mostNotesCreatedInDay,
      noteWithMostEdits
    };
  }

  private async getOrganizationStats(
    startDate: number,
    endDate: number
  ): Promise<OrganizationStats> {
    const totalNotebooks = await this.db.notebooks.all
      .where((eb) => eb("dateCreated", ">=", startDate))
      .where((eb) => eb("dateCreated", "<", endDate))
      .count();
    const totalTags = await this.db.tags.all
      .where((eb) => eb("dateCreated", ">=", startDate))
      .where((eb) => eb("dateCreated", "<", endDate))
      .count();

    const tags = await this.db.tags.all.items();
    const tagStats: OrganizationStats["mostUsedTags"] = [];

    for (const tag of tags) {
      const noteCount = await this.db.relations
        .from({ id: tag.id, type: "tag" }, "note")
        .count();

      if (noteCount > 0) {
        tagStats.push({
          id: tag.id,
          title: tag.title,
          noteCount: noteCount
        });
      }
    }

    const mostUsedTags = tagStats
      .sort((a, b) => b.noteCount - a.noteCount)
      .slice(0, 3);

    const allNotebooks = await this.db.notebooks.all.items();
    const notebookStats: OrganizationStats["mostActiveNotebooks"] = [];

    for (const notebook of allNotebooks) {
      const noteCounts = await this.db.notebooks.totalNotes(notebook.id);
      const noteCount = noteCounts[0] || 0;

      if (noteCount > 0) {
        notebookStats.push({
          id: notebook.id,
          title: notebook.title,
          noteCount
        });
      }
    }

    const mostActiveNotebooks = notebookStats
      .sort((a, b) => b.noteCount - a.noteCount)
      .slice(0, 3);

    const totalColors = await this.db.colors.all
      .where((eb) => eb("dateCreated", ">=", startDate))
      .where((eb) => eb("dateCreated", "<", endDate))
      .count();
    const favoritedNotes = await this.db.notes.favorites
      .where((eb) => eb("dateCreated", ">=", startDate))
      .where((eb) => eb("dateCreated", "<", endDate))
      .count();
    const archivedNotes = await this.db.notes.archived
      .where((eb) => eb("dateCreated", ">=", startDate))
      .where((eb) => eb("dateCreated", "<", endDate))
      .count();

    return {
      totalNotebooks,
      totalTags,
      mostUsedTags,
      mostActiveNotebooks,
      totalColors,
      favoritedNotes,
      archivedNotes
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
}
