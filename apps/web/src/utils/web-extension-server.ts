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

import { db } from "../common/db";
import {
  ItemReference,
  NotebookReference,
  Server,
  Clip
} from "@notesnook/web-clipper/dist/common/bridge";
import { isUserPremium } from "../hooks/use-is-user-premium";
import { store as themestore } from "../stores/theme-store";
import { store as appstore } from "../stores/app-store";
import { h } from "./html";
import { sanitizeFilename } from "@notesnook/common";
import { attachFile } from "../components/editor/picker";
import { getFormattedDate } from "@notesnook/common";

export class WebExtensionServer implements Server {
  async login() {
    const user = await db.user?.getUser();
    const { theme, accent } = themestore.get();
    if (!user) return { pro: false, theme, accent };
    return { email: user.email, pro: isUserPremium(user), theme, accent };
  }

  async getNotes(): Promise<ItemReference[] | undefined> {
    return db.notes?.all
      .filter((n) => !n.locked)
      .map((note) => ({ id: note.id, title: note.title }));
  }

  async getNotebooks(): Promise<NotebookReference[] | undefined> {
    return db.notebooks?.all.map((nb) => ({
      id: nb.id,
      title: nb.title,
      topics: nb.topics.map((topic: ItemReference) => ({
        id: topic.id,
        title: topic.title
      }))
    }));
  }

  async getTags(): Promise<ItemReference[] | undefined> {
    return db.tags?.all.map((tag) => ({
      id: tag.id,
      title: tag.title
    }));
  }

  async saveClip(clip: Clip) {
    let clipContent = "";

    if (clip.mode === "simplified" || clip.mode === "screenshot") {
      clipContent += clip.data;
    } else {
      const clippedFile = new File(
        [new TextEncoder().encode(clip.data).buffer],
        `${sanitizeFilename(clip.title)}.clip`,
        {
          type: "application/vnd.notesnook.web-clip"
        }
      );

      const attachment = await attachFile(clippedFile);
      if (!attachment) return;

      clipContent += h("iframe", [], {
        "data-hash": attachment.hash,
        "data-mime": attachment.mime,
        src: clip.url,
        title: clip.pageTitle || clip.title,
        width: clip.width ? `${clip.width}` : undefined,
        height: clip.height ? `${clip.height}` : undefined,
        class: "web-clip"
      }).outerHTML;
    }

    const note = clip.note?.id ? db.notes?.note(clip.note?.id) : null;

    let content = (await note?.content()) || "";
    content += clipContent;
    content += h("div", [
      h("hr"),
      h("p", ["Clipped from ", h("a", [clip.title], { href: clip.url })]),
      h("p", [`Date clipped: ${getFormattedDate(Date.now())}`])
    ]).innerHTML;

    const id = await db.notes?.add({
      id: note?.id,
      title: note ? note.title : clip.title,
      content: { type: "tiptap", data: content },
      tags: note ? note.tags : clip.tags
    });

    if (clip.refs && id && !clip.note) {
      for (const ref of clip.refs) {
        switch (ref.type) {
          case "notebook":
            await db.notes?.addToNotebook({ id: ref.id }, id);
            break;
          case "topic":
            await db.notes?.addToNotebook(
              { id: ref.parentId, topic: ref.id },
              id
            );
            break;
        }
      }
    }
    await appstore.refresh();
  }
}
