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
import { NoteContent } from "../collections/session-content";

export const VAULT_ERRORS = {
  noVault: "ERR_NO_VAULT",
  vaultLocked: "ERR_VAULT_LOCKED",
  wrongPassword: "ERR_WRONG_PASSWORD"
};

export default class Vault {
  eraseTime = 1000 * 60 * 30;
  private vaultPassword?: string;
  private erasureTimeout = 0;
  private key = "svvaads1212#2123";

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
    }, this.eraseTime) as unknown as number;
  }

  constructor(private readonly db: Database) {
    this.password = undefined;
    EV.subscribe(EVENTS.userLoggedOut, () => {
      this.password = undefined;
    });
  }

  get unlocked() {
    return !!this.vaultPassword;
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
    const vault = await this.db.vaults.default();
    if (!vault) throw new Error(VAULT_ERRORS.noVault);

    if (await this.unlock(oldPassword)) {
      const relations = await this.db.relations.from(vault, "note").get();
      for (const { toId: noteId } of relations) {
        const content = await this.db.content.findByNoteId(noteId);
        if (!content || !content.locked) {
          await this.db.relations.unlink(vault, { id: noteId, type: "note" });
          continue;
        }

        try {
          const decryptedContent = await this.decryptContent(
            content,
            oldPassword
          );

          await this.encryptContent(
            decryptedContent,
            noteId,
            newPassword,
            `${Date.now()}`
          );
        } catch (e) {
          console.error(e);
          throw new Error(
            `Could not decrypt content of note ${noteId}. Error: ${
              (e as Error).message
            }`
          );
        }
      }

      await this.db.vaults.add({
        id: vault.id,
        key: await this.db
          .storage()
          .encrypt({ password: newPassword }, this.key)
      });
    }
  }

  async clear(password: string) {
    const vault = await this.db.vaults.default();
    if (!vault) return;

    if (await this.unlock(password)) {
      const relations = await this.db.relations.from(vault, "note").get();
      for (const { toId: noteId } of relations) {
        await this.unlockNote(noteId, password, true);
        await this.db.relations.unlink(vault, { id: noteId, type: "note" });
      }
    }
  }

  async delete(deleteAllLockedNotes = false) {
    const vault = await this.db.vaults.default();
    if (!vault) return;

    if (deleteAllLockedNotes) {
      const relations = await this.db.relations.from(vault, "note").get();
      const lockedIds = relations.map((r) => r.toId);
      await this.db.notes.remove(...lockedIds);
    }

    await this.db.vaults.remove(vault.id);
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
    await this.unlockNote(noteId, password, true);

    const vault = await this.db.vaults.default();
    if (!vault) await this.create(password);
    else await this.db.relations.unlink(vault, { id: noteId, type: "note" });
  }

  /**
   * Temporarily unlock (open) a note
   */
  async open(noteId: string, password?: string) {
    const note = await this.db.notes.note(noteId);
    if (!note) return;

    const content = await this.unlockNote(noteId, password, false);
    if (password) {
      this.password = password;
      if (!(await this.exists())) await this.create(password);
    }
    return { ...note, ...content };
  }

  /**
   * Saves a note in the vault
   */
  async save(note: {
    content?: NoteContent<false>;
    sessionId?: string;
    id: string;
  }) {
    if (!note) return;
    // roll over erase timer
    this.startEraser();
    return await this.lockNote(note, await this.getVaultPassword());
  }

  async exists(vaultKey?: Cipher<"base64">) {
    if (!vaultKey) vaultKey = await this.getKey();
    return !!vaultKey && isCipher(vaultKey);
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
    noteId: string,
    password: string,
    sessionId?: string
  ) {
    const encryptedContent = await this.db
      .storage()
      .encrypt({ password }, JSON.stringify(content.data));

    await this.db.content.add({
      noteId,
      sessionId,
      data: encryptedContent,
      type: content.type
    });
  }

  async decryptContent(encryptedContent: NoteContent<true>, password?: string) {
    if (!password) password = await this.getVaultPassword();

    if (!isCipher(encryptedContent.data))
      return encryptedContent as unknown as NoteContent<false>;

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
    item: {
      content?: NoteContent<false>;
      sessionId?: string;
      id: string;
    },
    password: string
  ) {
    const vault = await this.db.vaults.default();
    if (!vault) throw new Error(VAULT_ERRORS.noVault);

    const { id, content, sessionId } = item;
    let { type, data } = content || {};

    const locked = await this.db.relations.from(vault, "note").has(id);

    // Case: when note is being newly locked
    if (!locked && (!data || !type)) {
      const content = await this.db.content.findByNoteId(id);
      if (!content || content.locked) {
        await this.db.relations.add(vault, {
          id,
          type: "note"
        });
        return id;
      }
      // NOTE:
      // At this point, the note already has all the attachments extracted
      // so we should just encrypt it as normal.
      data = content.data;
      type = content.type;
    } else if (data && type) {
      data = await this.db.content.extractAttachments({
        data,
        type,
        noteId: id
      });
    }

    if (data && type)
      await this.encryptContent({ data, type }, id, password, sessionId);

    await this.db.notes.add({
      id,
      headline: "",
      dateEdited: Date.now()
    });

    await this.db.relations.add(vault, {
      id,
      type: "note"
    });

    return id;
  }

  private async unlockNote(noteId: string, password?: string, perm = false) {
    const content = await this.db.content.findByNoteId(noteId);
    if (!content || !content.locked) return;
    const decryptedContent = await this.decryptContent(content, password);

    if (perm) {
      await this.db.notes.add({
        id: noteId,
        contentId: content.id,
        content: decryptedContent
      });
      // await this.db.content.add({ id: note.contentId, data: content });
      return;
    }

    return {
      content: decryptedContent
    };
  }

  async getKey() {
    const vault = await this.db.vaults.default();
    return vault?.key;
  }

  async setKey(vaultKey: Cipher<"base64">) {
    const vault = await this.db.vaults.default();
    if (vault) return;
    await this.db.vaults.add({ title: "Default", key: vaultKey });
  }
}
