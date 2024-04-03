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

import { Flex, Text } from "@theme-ui/components";
import { SaveState, useEditorStore } from "../../stores/editor-store";
import { Loading, Saved, NotSaved } from "../icons";
import { useNoteStatistics } from "./manager";
import { getFormattedDate } from "@notesnook/common";

const SAVE_STATE_ICON_MAP = {
  "-1": NotSaved,
  0: Loading,
  1: Saved
};

function EditorFooter() {
  const { words } = useNoteStatistics();
  const session = useEditorStore((store) => store.getActiveSession());
  if (!session) return null;

  const saveState = session.type === "default" ? session.saveState : null;
  const dateEdited = "note" in session ? session.note.dateEdited : 0;
  const SaveStateIcon = SAVE_STATE_ICON_MAP[saveState ?? -1];

  return (
    <Flex sx={{ alignItems: "center", gap: 2 }}>
      <Text
        className="selectable"
        data-test-id="editor-word-count"
        variant="subBody"
        sx={{ color: "paragraph" }}
      >
        {words.total + " words"}
        {words.selected ? ` (${words.selected} selected)` : ""}
      </Text>
      {dateEdited > 0 ? (
        <Text
          className="selectable"
          variant="subBody"
          sx={{ color: "paragraph" }}
          data-test-id="editor-date-edited"
          title={dateEdited.toString()}
        >
          {getFormattedDate(dateEdited)}
        </Text>
      ) : null}
      {SaveStateIcon && (
        <SaveStateIcon
          size={13}
          color={
            saveState === SaveState.Saved
              ? "accent"
              : saveState === SaveState.NotSaved
              ? "red"
              : "paragraph"
          }
        />
      )}
    </Flex>
  );
}
export default EditorFooter;
