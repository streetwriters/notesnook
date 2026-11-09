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

import { strings } from "@notesnook/intl";
import { useEditorStore } from "../../stores/editor-store";
import { logger } from "../../utils/logger";
import { showToast } from "../../utils/toast";

export async function saveContent(
  noteId: string,
  ignoreEdit: boolean,
  content: string
) {
  logger.debug("saving content", {
    noteId,
    ignoreEdit,
    length: content.length
  });
  await Promise.race([
    useEditorStore.getState().saveSessionContent(noteId, ignoreEdit, {
      type: "tiptap",
      data: content
    }),
    new Promise((_, reject) =>
      setTimeout(
        () => reject(new Error(strings.savingNoteTakingTooLong())),
        30 * 1000
      )
    )
  ]).catch((e) => {
    const { hide } = showToast(
      "error",
      (e as Error).message,
      [{ text: strings.dismiss(), onClick: () => hide() }],
      0
    );
  });
}
