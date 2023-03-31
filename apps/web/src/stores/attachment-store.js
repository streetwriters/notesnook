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

import createStore from "../common/store";
import { db } from "../common/db";
import BaseStore from "./index";
import { AppEventManager, AppEvents } from "../common/app-events";
import { store as editorStore } from "./editor-store";
import { checkAttachment } from "../common/attachments";
import { showToast } from "../utils/toast";

class AttachmentStore extends BaseStore {
  attachments = [];

  init = () => {
    AppEventManager.subscribe(
      AppEvents.UPDATE_ATTACHMENT_PROGRESS,
      ({ hash, type, total, loaded }) => {
        this.set((state) => {
          const index = state.attachments.findIndex(
            (a) => a.metadata.hash === hash
          );
          if (index <= -1) return;
          const percent = Math.round((loaded / total) * 100);
          const status =
            percent < 100 ? { type, loaded, total, progress: percent } : null;
          if (!status) this.refresh();
          state.attachments[index] = {
            ...state.attachments[index],
            status
          };
        });
      }
    );
    this.refresh();
  };

  refresh = () => {
    this.set((state) => (state.attachments = db.attachments.all));
  };

  filter = (query) => {
    if (!query || !query.trim().length) return this.refresh();

    this.set(
      (state) =>
        (state.attachments = db.lookup.attachments(db.attachments.all, query))
    );
  };

  recheck = async (hashes) => {
    const attachments = this.get().attachments;
    for (let hash of hashes) {
      const index = attachments.findIndex((a) => a.metadata.hash === hash);
      try {
        this._changeWorkingStatus(index, "recheck", undefined);

        const { failed, success } = await checkAttachment(hash);
        this._changeWorkingStatus(index, false, success ? null : failed);
      } catch (e) {
        console.error(e);
        this._changeWorkingStatus(index, false, false);
        showToast("error", `Rechecking failed: ${e.message}`);
      }
    }
  };

  rename = async (hash, newName) => {
    await db.attachments.add({
      hash,
      filename: newName
    });
    this.get().refresh();
  };

  permanentDelete = async (hash) => {
    const index = this.get().attachments.findIndex(
      (a) => a.metadata.hash === hash
    );
    if (index <= -1) return;
    const noteIds = this.get().attachments[index].noteIds.slice();

    try {
      this._changeWorkingStatus(index, "delete", undefined);
      if (await db.attachments.remove(hash, false)) {
        this.get().refresh();

        if (noteIds.includes(editorStore.get().session.id)) {
          await editorStore.clearSession();
        }
      }
    } catch (e) {
      console.error(e);
      this._changeWorkingStatus(index, false, false);
      showToast("error", `Failed to delete: ${e.message}`);
      throw e;
    }
  };

  /**
   *
   * @param {*} index
   * @param {"delete"|"recheck"} workType
   * @param {*} failed
   */
  _changeWorkingStatus = (index, workType, failed) => {
    this.set((state) => {
      state.attachments[index].failed = failed;
      state.attachments[index].working = workType;
    });
  };
}

/**
 * @type {[import("zustand").UseStore<AttachmentStore>, AttachmentStore]}
 */
const [useStore, store] = createStore(AttachmentStore);
export { useStore, store };
