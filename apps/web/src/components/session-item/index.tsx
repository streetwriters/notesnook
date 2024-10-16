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

import { getFormattedHistorySessionDate } from "@notesnook/common";
import { HistorySession } from "@notesnook/core";
import { Flex, Text } from "@theme-ui/components";
import TimeAgo from "../time-ago";
import { Lock } from "../icons";
import { useEditorStore } from "../../stores/editor-store";
import { strings } from "@notesnook/intl";

type SessionItemProps = {
  session: HistorySession;
  noteId: string;
};
export function SessionItem(props: SessionItemProps) {
  const { session, noteId } = props;
  const label = getFormattedHistorySessionDate(session);

  return (
    <Flex
      key={session.id}
      data-test-id={`session-item`}
      py={1}
      px={1}
      sx={{
        cursor: "pointer",
        bg: "transparent",
        ":hover": {
          bg: "hover"
        },
        alignItems: "center",
        justifyContent: "space-between"
      }}
      title={strings.clickToPreview()}
      onClick={() =>
        useEditorStore.getState().openDiffSession(noteId, session.id)
      }
    >
      <Text variant={"body"} data-test-id="title">
        {label}
      </Text>
      <Flex
        sx={{
          fontSize: "subBody",
          color: "paragraph-secondary",
          flexShrink: 0
        }}
      >
        {session.locked && <Lock size={14} data-test-id="locked" />}
        <TimeAgo live datetime={session.dateModified} locale={"en_short"} />
      </Flex>
    </Flex>
  );
}
