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
import { createZipStream } from "../utils/streams/zip-stream";
import { createWriteStream } from "../utils/stream-saver";
import { Attachment, VirtualizedGrouping } from "@notesnook/core";

let abortController: AbortController | undefined = undefined;
class AttachmentStore extends BaseStore<AttachmentStore> {
  attachments?: VirtualizedGrouping<Attachment>;
  status?: { current: number; total: number };
  processing: Record<
    string,
    { failed?: string; working?: "delete" | "recheck" }
  > = {};

  refresh = async () => {
    this.set({
      attachments: await db.attachments.all.sorted({
        sortBy: "dateCreated",
        sortDirection: "desc"
      })
    });
  };

  init = () => {
    this.refresh();
  };

  download = async (ids: string[]) => {
    if (this.get().status)
      throw new Error(
        "Please wait for the previous download to finish or cancel it."
      );

    this.set({ status: { current: 0, total: ids.length } });

    abortController = new AbortController();
    const attachmentStream = new AttachmentStream(
      ids,
      (id) => this.attachments?.item(id),
      abortController.signal,
      (current) => {
        this.set({ status: { current, total: ids.length } });
      }
    );
    await attachmentStream
      .pipeThrough(createZipStream(abortController.signal))
      .pipeTo(
        await createWriteStream("attachments.zip", {
          signal: abortController.signal
        })
      );

    this.set((state) => (state.status = undefined));
  };

  cancel = async () => {
    if (abortController) {
      abortController.abort();
      abortController = undefined;
      this.set((state) => (state.status = undefined));
    }
  };

  recheck = async (ids: string[]) => {
    for (const id of ids) {
      const attachment = await this.attachments?.item(id);
      if (!attachment) continue;
      try {
        this._changeWorkingStatus(attachment.hash, "recheck");

        const { failed, success } = await checkAttachment(attachment.hash);
        this._changeWorkingStatus(
          attachment.hash,
          undefined,
          success ? undefined : failed
        );
      } catch (e) {
        console.error(e);
        this._changeWorkingStatus(attachment.hash);
        if (e instanceof Error)
          showToast("error", `Rechecking failed: ${e.message}`);
      }
    }
  };

  rename = async (hash: string, newName: string) => {
    await db.attachments.add({
      hash,
      filename: newName
    });
    await this.get().refresh();
  };

  permanentDelete = async (attachment: Attachment) => {
    try {
      this._changeWorkingStatus(attachment.hash, "delete");
      if (await db.attachments.remove(attachment.hash, false)) {
        await this.get().refresh();

        const sessionId = editorStore.get().session.id;
        if (
          sessionId &&
          (await db.relations
            .to({ id: attachment.id, type: "attachment" }, "note")
            .has(sessionId))
        ) {
          await editorStore.clearSession();
        }
      }
    } catch (e) {
      console.error(e);
      this._changeWorkingStatus(attachment.hash);
      if (e instanceof Error)
        showToast("error", `Failed to delete: ${e.message}`);
      throw e;
    }
  };

  private _changeWorkingStatus = (
    hash: string,
    working?: "delete" | "recheck",
    failed?: string
  ) => {
    this.set((state) => {
      state.processing[hash] = { failed, working };
    });
  };
}

const [useStore, store] = createStore(AttachmentStore);
export { useStore, store };
