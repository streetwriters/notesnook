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

const SAVE_STATE_ICON_MAP = {
  "-1": NotSaved,
  0: Loading,
  1: Saved
};

function EditorFooter() {
  const activeSessionId = useEditorStore((store) => store.activeSessionId);
  const { words } = useNoteStatistics(activeSessionId || "unknown");
  const saveState = useEditorStore(
    (store) => store.getActiveSession(["default", "unlocked"])?.saveState
  );
  const SaveStateIcon = saveState ? SAVE_STATE_ICON_MAP[saveState] : null;

  if (!activeSessionId) return null;
  return (
    <Flex sx={{ alignItems: "center" }}>
      <Text
        className="selectable"
        data-test-id="editor-word-count"
        variant="subBody"
        mr={2}
        sx={{ color: "paragraph" }}
      >
        {words.total + " words"}
        {words.selected ? ` (${words.selected} selected)` : ""}
      </Text>
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
