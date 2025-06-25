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
import Database from "./index.js";
import { CHECK_IDS, EV, EVENTS, checkIsUserPremium } from "../common.js";
import { isCipher } from "../utils/crypto.js";
import { Note, NoteContent } from "../types.js";
import { logger } from "../logger.js";

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
    EV.publish(EVENTS.vaultUnlocked);
    clearTimeout(this.erasureTimeout);
    this.erasureTimeout = setTimeout(() => {
      this.lock();
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

  async lock() {
    this.password = undefined;
    EV.publish(EVENTS.vaultLocked);
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
          logger.error(e, `Could not decrypt content of note ${noteId}`);
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

    if (!(await this.exists())) await this.create(password);
    await this.db.relations.to({ id: noteId, type: "note" }, "vault").unlink();
  }

  /**
   * Temporarily unlock (open) a note
   */
  async open(
    noteId: string,
    password?: string
  ): Promise<(Note & { content?: NoteContent<false> }) | undefined> {
    const note = await this.db.notes.note(noteId);
    if (!note) return;

    const content = await this.unlockNote(
      noteId,
      password || this.password,
      false
    );

    if (password) {
      this.password = password;
      if (!(await this.exists())) await this.create(password);
    }
    return { ...note, content };
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

    return await this.db.content.add({
      noteId,
      sessionId,
      data: encryptedContent,
      dateEdited: Date.now(),
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

    return <NoteContent<false>>{
      type: encryptedContent.type,
      data: JSON.parse(decryptedContent)
    };
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
      const rawContent = await this.db.content.findByNoteId(id);
      if (rawContent?.locked) {
        await this.db.relations.add(vault, {
          id,
          type: "note"
        });
        return id;
      }
      // NOTE:
      // At this point, the note already has all the attachments extracted
      // so we should just encrypt it as normal.
      data = rawContent?.data || "<p></p>";
      type = rawContent?.type || "tiptap";
    } else if (data && type) {
      data = await this.db.content.postProcess({
        data,
        type,
        noteId: id
      });
    }

    await this.db.notes.add({
      id,
      headline: "",
      dateEdited: Date.now(),
      contentId:
        data && type
          ? await this.encryptContent({ data, type }, id, password, sessionId)
          : undefined
    });

    await this.db.relations.add(vault, {
      id,
      type: "note"
    });

    return id;
  }

  private async unlockNote(
    noteId: string,
    password?: string,
    perm = false
  ): Promise<NoteContent<false> | undefined> {
    const content = await this.db.content.findByNoteId(noteId);
    if (!content || !content.locked) {
      await this.db.relations
        .to({ id: noteId, type: "note" }, "vault")
        .unlink();
      return content ? { data: content.data, type: content.type } : undefined;
    }
    const decryptedContent = await this.decryptContent(content, password);

    if (await this.db.content.preProcess(decryptedContent)) {
      if (!password) password = await this.getVaultPassword();
      await this.encryptContent(
        decryptedContent,
        noteId,
        password,
        `${Date.now}`
      );
    }

    if (perm) {
      await this.db.relations
        .to({ id: noteId, type: "note" }, "vault")
        .unlink();
      await this.db.notes.add({
        id: noteId,
        contentId: content.id,
        content: decryptedContent
      });
      // await this.db.content.add({ id: note.contentId, data: content });
      return;
    }

    return decryptedContent;
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
