/* This file is part of the Notesnook project (https://notesnook.com/)
 *
 * Copyright (C) 2022 Streetwriters (Private) Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

import { formatDate } from "@notesnook/core/utils/date";
import { Flex, Text } from "@streetwriters/rebass";
import { useStore } from "../../stores/editor-store";
import { Loading, Saved, NotSaved } from "../icons";
import { useNoteStatistics } from "./context";

const SAVE_STATE_ICON_MAP = {
  "-1": NotSaved,
  0: Loading,
  1: Saved
};

function EditorFooter() {
  const { words } = useNoteStatistics();
  const dateEdited = useStore((store) => store.session.dateEdited);
  const id = useStore((store) => store.session.id);
  const SaveStateIcon = useStore(
    (store) => SAVE_STATE_ICON_MAP[store.session.saveState]
  );

  if (!id) return null;
  return (
    <Flex alignItems="center">
      <Text
        className="selectable"
        data-test-id="editor-word-count"
        variant="subBody"
        color="bgSecondaryText"
        mr={2}
      >
        {words.total + " words"}
        {words.selected ? ` (${words.selected} selected)` : ""}
      </Text>
      <Text
        className="selectable"
        variant="subBody"
        color="bgSecondaryText"
        mr={2}
      >
        {formatDate(dateEdited || Date.now())}
      </Text>
      {SaveStateIcon && <SaveStateIcon size={13} color="bgSecondaryText" />}
    </Flex>
  );
}
export default EditorFooter;
