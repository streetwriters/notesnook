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
import type { HistorySession } from "@notesnook/core";
import { strings } from "@notesnook/intl";
import { Flex, Text } from "@ui";
import TimeAgo from "../time-ago";
import { Lock } from "../icons";
import { useEditorStore } from "../../stores/editor-store";

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
      testID="session-item"
      title={strings.clickToPreview()}
      onPress={() =>
        useEditorStore.getState().openDiffSession(noteId, session.id)
      }
      sx={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        p: "spacing2",
        borderRadius: "radius1",
        cursor: "pointer",
        bg: "transparent",
        ":hover": { bg: "hover" }
      }}
    >
      <Text
        testID="title"
        numberOfLines={1}
        sx={{ color: "paragraph", fontSize: "xs", lineHeight: 1 }}
      >
        {label}
      </Text>
      <Flex
        sx={{
          flexDirection: "row",
          ml: "spacing2",
          alignItems: "center",
          gap: "spacing2",
          flexShrink: 0
        }}
      >
        {session.locked && <Lock size={11} color="icon" testID="locked" />}
        <TimeAgo
          live
          datetime={session.dateModified}
          locale="en_short"
          sx={{ color: "paragraph", fontSize: "3xs", lineHeight: 1 }}
        />
      </Flex>
    </Flex>
  );
}
