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
import { store as appstore } from "../stores/app-store";
import { h } from "./html";
import { sanitizeFilename } from "@notesnook/common";
import { getFormattedDate } from "@notesnook/common";
import { useStore as useThemeStore } from "../stores/theme-store";
import { isCipher } from "@notesnook/core";
import { attachFiles } from "../components/editor/picker";

export class WebExtensionServer implements Server {
  async login() {
    const { colorScheme, darkTheme, lightTheme } = useThemeStore.getState();
    const user = await db.user.getUser();
    const theme = colorScheme === "dark" ? darkTheme : lightTheme;
    if (!user) return { pro: false, theme };
    return { email: user.email, pro: isUserPremium(user), theme };
  }

  async getNotes(): Promise<ItemReference[] | undefined> {
    const notes = await db.notes.all
      // TODO: .where((eb) => eb("notes.locked", "==", false))
      .fields(["notes.id", "notes.title"])
      .items(undefined, db.settings.getGroupOptions("notes"));
    return notes;
  }

  async getNotebooks(
    parentId?: string
  ): Promise<NotebookReference[] | undefined> {
    if (!parentId)
      return await db.notebooks.roots
        .fields(["notebooks.id", "notebooks.title"])
        .items();

    return await db.relations
      .from({ type: "notebook", id: parentId as string }, "notebook")
      .selector.fields(["notebooks.id", "notebooks.title"])
      .items();
  }

  async getTags(): Promise<ItemReference[] | undefined> {
    const tags = await db.tags.all
      .fields(["tags.id", "tags.title"])
      .items(undefined, db.settings.getGroupOptions("tags"));
    return tags;
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

      const attachment = (await attachFiles([clippedFile]))?.at(0);
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

    const note = clip.note?.id ? await db.notes.note(clip.note?.id) : null;

    let content =
      (!!note?.contentId && (await db.content.get(note.contentId))?.data) || "";
    if (isCipher(content)) return;

    content += clipContent;
    content += h("div", [
      h("hr"),
      h("p", ["Clipped from ", h("a", [clip.title], { href: clip.url })]),
      h("p", [`Date clipped: ${getFormattedDate(Date.now())}`])
    ]).innerHTML;

    const id = await db.notes.add({
      id: note?.id,
      title: note ? note.title : clip.title,
      content: { type: "tiptap", data: content }
    });

    if (clip.refs && id && !clip.note) {
      for (const ref of clip.refs) {
        switch (ref.type) {
          case "notebook":
            if (!(await db.notebooks.exists(ref.id))) continue;
            await db.notes.addToNotebook(ref.id, id);
            break;
          case "tag":
            if (!(await db.tags.exists(ref.id))) continue;
            await db.relations.add(ref, { id, type: "note" });
        }
      }
    }
    await appstore.refresh();
  }
}
