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

import { Cipher } from "@notesnook/crypto";
import Database from ".";
import { CHECK_IDS, EV, EVENTS, checkIsUserPremium } from "../common";
import { tinyToTiptap } from "../migrations";
import { isCipher } from "../database/crypto";
import { EncryptedContentItem, Note, isDeleted } from "../types";
import {
  EMPTY_CONTENT,
  isEncryptedContent,
  isUnencryptedContent
} from "../collections/content";
import { NoteContent } from "../collections/session-content";

export const VAULT_ERRORS = {
  noVault: "ERR_NO_VAULT",
  vaultLocked: "ERR_VAULT_LOCKED",
  wrongPassword: "ERR_WRONG_PASSWORD"
};

const ERASE_TIME = 1000 * 60 * 30;
export default class Vault {
  vaultPassword?: string;
  erasureTimeout = 0;
  key = "svvaads1212#2123";

  private get password() {
    return this.vaultPassword;
  }

  private set password(value) {
    this.vaultPassword = value;
    if (value) {
      this.startEraser();
    }
  }

  private startEraser() {
    clearTimeout(this.erasureTimeout);
    this.erasureTimeout = setTimeout(() => {
      this.password = undefined;
      EV.publish(EVENTS.vaultLocked);
    }, ERASE_TIME) as unknown as number;
  }

  constructor(private readonly db: Database) {
    this.password = undefined;
    EV.subscribe(EVENTS.userLoggedOut, () => {
      this.password = undefined;
    });
  }

  async create(password: string) {
    if (!(await checkIsUserPremium(CHECK_IDS.vaultAdd))) return;

    const vaultKey = await this.getKey();
    if (!vaultKey || !isCipher(vaultKey)) {
      const encryptedData = await this.db
        .storage()
        .encrypt({ password }, this.key);
      await this.setKey(encryptedData);
      this.password = password;
    }
    return true;
  }

  async unlock(password: string) {
    const vaultKey = await this.getKey();
    if (!vaultKey || !(await this.exists(vaultKey)))
      throw new Error(VAULT_ERRORS.noVault);
    try {
      await this.db.storage().decrypt({ password }, vaultKey);
    } catch (e) {
      throw new Error(VAULT_ERRORS.wrongPassword);
    }
    this.password = password;
    return true;
  }

  async changePassword(oldPassword: string, newPassword: string) {
    if (await this.unlock(oldPassword)) {
      const contentItems = [];
      for (const note of this.db.notes.locked) {
        if (!note.contentId) continue;
        const encryptedContent = await this.db.content.raw(note.contentId);
        if (
          !encryptedContent ||
          isDeleted(encryptedContent) ||
          !isEncryptedContent(encryptedContent)
        )
          continue;

        try {
          const content = await this.decryptContent(
            encryptedContent,
            oldPassword
          );
          contentItems.push({
            ...content,
            id: note.contentId,
            noteId: note.id
          });
        } catch (e) {
          console.error(e);
          throw new Error(
            `Could not decrypt content of note ${note.id}. Error: ${
              (e as Error).message
            }`
          );
        }
      }

      for (const content of contentItems) {
        await this.encryptContent(content, newPassword, content.id);
      }

      await this.db.storage().remove("vaultKey");
      await this.create(newPassword);
    }
  }

  async clear(password: string) {
    if (await this.unlock(password)) {
      await this.db.notes.init();
      for (const note of this.db.notes.locked) {
        await this.unlockNote(note, password, true);
      }
    }
  }

  async delete(deleteAllLockedNotes = false) {
    if (deleteAllLockedNotes) {
      await this.db.notes.init();
      await this.db.notes.remove(
        ...this.db.notes.locked.map((note) => note.id)
      );
    }
    await this.db.storage().remove("vaultKey");
    this.password = undefined;
  }

  /**
   * Locks (add to vault) a note
   */
  async add(noteId: string) {
    if (!(await checkIsUserPremium(CHECK_IDS.vaultAdd))) return;

    await this.lockNote({ id: noteId }, await this.getVaultPassword());
    await this.db.noteHistory.clearSessions(noteId);
  }

  /**
   * Permanently unlocks (remove from vault) a note
   */
  async remove(noteId: string, password: string) {
    const note = this.db.notes.note(noteId);
    if (!note) return;
    await this.unlockNote(note.data, password, true);

    if (!(await this.exists())) await this.create(password);
  }

  /**
   * Temporarily unlock (open) a note
   */
  async open(noteId: string, password: string) {
    const note = this.db.notes.note(noteId);
    if (!note) return;

    const unlockedNote = await this.unlockNote(note.data, password, false);
    this.password = password;
    if (!(await this.exists())) await this.create(password);
    return unlockedNote;
  }

  /**
   * Saves a note in the vault
   */
  async save(
    note: Partial<Note & { content: NoteContent<false>; sessionId: string }> & {
      id: string;
    }
  ) {
    if (!note) return;
    // roll over erase timer
    this.startEraser();
    return await this.lockNote(note, await this.getVaultPassword());
  }

  async exists(vaultKey?: Cipher) {
    if (!vaultKey) vaultKey = await this.getKey();
    return vaultKey && isCipher(vaultKey);
  }

  // Private & internal methods

  private async getVaultPassword() {
    if (!(await this.exists())) {
      throw new Error(VAULT_ERRORS.noVault);
    }

    if (!this.password || !this.password.length) {
      throw new Error(VAULT_ERRORS.vaultLocked);
    }

    return this.password;
  }

  private async encryptContent(
    content: NoteContent<false>,
    password: string,
    contentId?: string,
    sessionId?: string
  ) {
    const encryptedContent = await this.db
      .storage()
      .encrypt({ password }, JSON.stringify(content.data));

    await this.db.content.add({
      id: contentId,
      sessionId,
      data: encryptedContent,
      type: content.type
    });
  }

  async decryptContent(
    encryptedContent: EncryptedContentItem,
    password?: string
  ) {
    if (!password) password = await this.getVaultPassword();

    if (
      encryptedContent.noteId &&
      typeof encryptedContent.data !== "object" &&
      !isCipher(encryptedContent.data)
    ) {
      await this.db.notes.add({
        id: encryptedContent.noteId,
        locked: false
      });
      return { data: encryptedContent.data, type: encryptedContent.type };
    }

    const decryptedContent = await this.db
      .storage()
      .decrypt({ password }, encryptedContent.data);

    const content: NoteContent<false> = {
      type: encryptedContent.type,
      data: JSON.parse(decryptedContent)
    };

    // #MIGRATION: convert tiny to tiptap
    if (content.type === "tiny") {
      content.type = "tiptap";
      content.data = tinyToTiptap(content.data);
    }

    return content;
  }

  private async lockNote(
    item: Partial<Note & { content: NoteContent<false>; sessionId: string }> & {
      id: string;
    },
    password: string
  ) {
    const { id, content, sessionId, title } = item;
    let { type, data } = content || {};

    const note = this.db.notes.note(id);
    if (!note) return;

    const contentId = note.contentId;
    //    if (!contentId) throw new Error("Cannot lock note because it is empty.");

    // Case: when note is being newly locked
    if (!note.locked && (!data || !type) && !!contentId) {
      const rawContent = await this.db.content.raw(contentId);
      if (
        !rawContent ||
        isDeleted(rawContent) ||
        !isUnencryptedContent(rawContent)
      )
        return await this.db.notes.add({
          id,
          locked: true
        });
      // NOTE:
      // At this point, the note already has all the attachments extracted
      // so we should just encrypt it as normal.
      data = rawContent.data;
      type = rawContent.type;
    } else if (data && type) {
      const content = await this.db.content.extractAttachments({
        ...EMPTY_CONTENT(id),
        data,
        type
      });
      data = content.data;
      type = content.type;
    }

    if (data && type)
      await this.encryptContent({ data, type }, password, contentId, sessionId);

    return await this.db.notes.add({
      id,
      locked: true,
      headline: "",
      title: title || note.title,
      favorite: note.data.favorite,
      localOnly: note.data.localOnly,
      readonly: note.data.readonly,
      dateEdited: Date.now()
    });
  }

  private async unlockNote(note: Note, password: string, perm = false) {
    if (!note.contentId) return;

    const encryptedContent = await this.db.content.raw(note.contentId);
    if (
      !encryptedContent ||
      isDeleted(encryptedContent) ||
      !isEncryptedContent(encryptedContent)
    )
      return;
    const content = await this.decryptContent(encryptedContent, password);

    if (perm) {
      await this.db.notes.add({
        id: note.id,
        locked: false,
        headline: note.headline,
        contentId: note.contentId,
        content
      });
      // await this.db.content.add({ id: note.contentId, data: content });
      return;
    }

    return {
      ...note,
      content
    };
  }

  async getKey() {
    return await this.db.storage().read<Cipher>("vaultKey");
  }

  async setKey(vaultKey: Cipher) {
    await this.db.storage().write("vaultKey", vaultKey);
  }
}
