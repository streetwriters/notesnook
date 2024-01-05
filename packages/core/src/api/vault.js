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

import { CHECK_IDS, EV, EVENTS, checkIsUserPremium } from "../common";
import { tinyToTiptap } from "../migrations";

const ERASE_TIME = 1000 * 60 * 30;
var ERASER_TIMEOUT = null;
export default class Vault {
  get _password() {
    return this._vaultPassword;
  }

  set _password(value) {
    this._vaultPassword = value;
    if (value) {
      this._startEraser();
    }
  }

  _startEraser() {
    clearTimeout(ERASER_TIMEOUT);
    ERASER_TIMEOUT = setTimeout(() => {
      this._password = null;
      EV.publish(EVENTS.vaultLocked);
    }, ERASE_TIME);
  }

  /**
   *
   * @param {import('./index').default} db
   */
  constructor(db) {
    this._db = db;
    this._storage = db.storage;
    this._key = "svvaads1212#2123";
    this._vaultPassword = null;
    this.ERRORS = {
      noVault: "ERR_NO_VAULT",
      vaultLocked: "ERR_VAULT_LOCKED",
      wrongPassword: "ERR_WRONG_PASSWORD"
    };
    EV.subscribe(EVENTS.userLoggedOut, () => {
      this._password = null;
    });
  }

  /**
   * Creates a new vault
   * @param {string} password The password
   * @returns {Promise<Boolean>}
   */
  async create(password) {
    if (!(await checkIsUserPremium(CHECK_IDS.vaultAdd))) return;

    const vaultKey = await this._getKey();
    if (!vaultKey || !vaultKey.cipher || !vaultKey.iv) {
      const encryptedData = await this._storage.encrypt(
        { password },
        this._key
      );
      await this._setKey(encryptedData);
      this._password = password;
    }
    return true;
  }

  /**
   * Unlocks the vault with the given password
   * @param {string} password The password
   * @throws  ERR_NO_VAULT | ERR_WRONG_PASSWORD
   * @returns {Promise<Boolean>}
   */
  async unlock(password) {
    const vaultKey = await this._getKey();
    if (!(await this.exists(vaultKey))) throw new Error(this.ERRORS.noVault);
    try {
      await this._storage.decrypt({ password }, vaultKey);
    } catch (e) {
      throw new Error(this.ERRORS.wrongPassword);
    }
    this._password = password;
    return true;
  }

  async changePassword(oldPassword, newPassword) {
    if (await this.unlock(oldPassword)) {
      await this._db.notes.init();

      const contentItems = [];
      for (const note of this._db.notes.locked) {
        try {
          let encryptedContent = await this._db.content.raw(note.contentId);
          let content = await this.decryptContent(
            encryptedContent,
            oldPassword
          );
          contentItems.push({
            ...content,
            id: note.contentId,
            noteId: note.id
          });
        } catch (e) {
          throw new Error(
            `Could not decrypt content of note ${note.id}. Error: ${e.message}`
          );
        }
      }

      for (const content of contentItems) {
        await this._encryptContent(
          content.id,
          null,
          content.data,
          content.type,
          newPassword
        );
      }

      await this._storage.remove("vaultKey");
      await this.create(newPassword);
    }
  }

  async clear(password) {
    if (await this.unlock(password)) {
      await this._db.notes.init();
      for (var note of this._db.notes.locked) {
        await this._unlockNote(note, password, true);
      }
    }
  }

  async delete(deleteAllLockedNotes = false) {
    if (deleteAllLockedNotes) {
      await this._db.notes.init();
      await this._db.notes.remove(
        ...this._db.notes.locked.map((note) => note.id)
      );
    }
    await this._storage.remove("vaultKey");
    this._password = null;
  }

  /**
   * Locks (add to vault) a note
   * @param {string} noteId The id of the note to lock
   */
  async add(noteId) {
    if (!(await checkIsUserPremium(CHECK_IDS.vaultAdd))) return;

    await this._check();
    await this._lockNote({ id: noteId }, this._password);
    await this._db.noteHistory.clearSessions(noteId);
  }

  /**
   * Permanently unlocks (remove from vault) a note
   * @param {string} noteId The note id
   * @param {string} password The password to unlock note with
   */
  async remove(noteId, password) {
    const note = this._db.notes.note(noteId);
    if (!note) return;
    await this._unlockNote(note.data, password, true);

    if (!(await this.exists())) await this.create(this.password);
  }

  /**
   * Temporarily unlock (open) a note
   * @param {string} noteId The note id
   * @param {string} password The password to open note with
   */
  async open(noteId, password) {
    const note = this._db.notes.note(noteId);
    if (!note) return;

    const unlockedNote = await this._unlockNote(note.data, password, false);
    this._password = password;
    if (!(await this.exists())) await this.create(password);
    return unlockedNote;
  }

  /**
   * Saves a note in the vault
   * @param {{Object}} note The note to save into the vault
   */
  async save(note) {
    if (!note) return;
    await this._check();
    // roll over erase timer
    this._startEraser();
    return await this._lockNote(note, this._password);
  }

  async exists(vaultKey = undefined) {
    if (!vaultKey) vaultKey = await this._getKey();
    return vaultKey && vaultKey.cipher && vaultKey.iv;
  }

  // Private & internal methods

  /** @private */
  _locked() {
    return !this._password || !this._password.length;
  }

  /** @private */
  async _check() {
    if (!(await this.exists())) {
      throw new Error(this.ERRORS.noVault);
    }

    if (this._locked()) {
      throw new Error(this.ERRORS.vaultLocked);
    }
  }

  /** @private */
  async _encryptContent(contentId, sessionId, content, type, password) {
    let encryptedContent = await this._storage.encrypt(
      { password },
      JSON.stringify(content)
    );

    await this._db.content.add({
      id: contentId,
      sessionId,
      data: encryptedContent,
      type
    });
  }

  async decryptContent(encryptedContent, password = null) {
    if (!password) {
      await this._check();
      password = this._password;
    }

    if (encryptedContent.noteId && typeof encryptedContent.data !== "object") {
      await this._db.notes.add({
        id: encryptedContent.noteId,
        locked: false
      });
      return encryptedContent;
    }

    let decryptedContent = await this._storage.decrypt(
      { password },
      encryptedContent.data
    );

    const content = {
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

  /** @private */
  async _lockNote(note, password) {
    let { id, content: { type, data } = {}, sessionId, title } = note;

    note = this._db.notes.note(id);
    if (!note) return;

    note = note.data;
    const contentId = note.contentId;
    if (!contentId) throw new Error("Cannot lock note because it is empty.");

    // Case: when note is being newly locked
    if (!note.locked && (!data || !type)) {
      let content = await this._db.content.raw(contentId, false);
      // NOTE:
      // At this point, the note already has all the attachments extracted
      // so we should just encrypt it as normal.
      data = content.data;
      type = content.type;
    } else if (data && type) {
      const content = await this._db.content.extractAttachments({
        data,
        type,
        noteId: id
      });
      data = content.data;
      type = content.type;
    }

    if (data && type)
      await this._encryptContent(contentId, sessionId, data, type, password);

    return await this._db.notes.add({
      id,
      locked: true,
      headline: "",
      title: title || note.title,
      favorite: note.favorite,
      localOnly: note.localOnly,
      readonly: note.readonly,
      dateEdited: Date.now()
    });
  }

  /** @private */
  async _unlockNote(note, password, perm = false) {
    let encryptedContent = await this._db.content.raw(note.contentId);
    let content = await this.decryptContent(encryptedContent, password);

    if (perm) {
      await this._db.notes.add({
        id: note.id,
        locked: false,
        headline: note.headline,
        contentId: note.contentId,
        content
      });
      // await this._db.content.add({ id: note.contentId, data: content });
      return;
    }

    return {
      ...note,
      content
    };
  }

  /** @inner */
  async _getKey() {
    return await this._storage.read("vaultKey");
  }

  /** @inner */
  async _setKey(vaultKey) {
    if (!vaultKey) return;
    await this._storage.write("vaultKey", vaultKey);
  }
}
