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
import { store as editorStore } from "./editor-store";
import { checkAttachment } from "../common/attachments";
import { showToast } from "../utils/toast";
import { AttachmentStream } from "../utils/streams/attachment-stream";
import { ZipStream } from "../utils/streams/zip-stream";
import { createWriteStream } from "../utils/stream-saver";

let abortController = undefined;
/**
 * @extends {BaseStore<AttachmentStore>}
 */
class AttachmentStore extends BaseStore {
  attachments = [];
  /**
   * @type {{current: number, total: number}}
   */
  status = undefined;

  refresh = () => {
    this.set((state) => (state.attachments = db.attachments.all));
  };

  init = () => {
    this.refresh();
  };

  download = async (attachments) => {
    if (this.get().status)
      throw new Error(
        "Please wait for the previous download to finish or cancel it."
      );

    this.set(
      (state) => (state.status = { current: 0, total: attachments.length })
    );

    abortController = new AbortController();
    const attachmentStream = new AttachmentStream(
      attachments,
      abortController.signal,
      (current) => {
        this.set(
          (state) => (state.status = { current, total: attachments.length })
        );
      }
    );
    await attachmentStream
      .pipeThrough(new ZipStream())
      .pipeTo(
        createWriteStream("attachments.zip", { signal: abortController.signal })
      );

    this.set((state) => (state.status = undefined));
  };

  cancel = async () => {
    if (abortController) {
      await abortController.abort();
      abortController = undefined;
      this.set((state) => (state.status = undefined));
    }
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

const [useStore, store] = createStore(AttachmentStore);
export { useStore, store };
