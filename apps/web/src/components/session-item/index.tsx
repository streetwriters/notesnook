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

import { getFormattedDate } from "@notesnook/common";
import { HistorySession } from "@notesnook/core";
import { Flex, Text } from "@theme-ui/components";
import TimeAgo from "../time-ago";
import { Lock } from "../icons";
import Vault from "../../common/vault";
import { db } from "../../common/db";
import { PreviewSession } from "../editor/types";

type SessionItemProps = {
  session: HistorySession;
  isPreviewMode: boolean;
  noteId: string;
  dateCreated: number;
  onOpenPreviewSession: (session: PreviewSession) => void;
};
export function SessionItem(props: SessionItemProps) {
  const { session, isPreviewMode, dateCreated, noteId, onOpenPreviewSession } =
    props;
  const fromDate = getFormattedDate(session.dateCreated, "date");
  const toDate = getFormattedDate(session.dateModified, "date");
  const fromTime = getFormattedDate(session.dateCreated, "time");
  const toTime = getFormattedDate(session.dateModified, "time");
  const label = `${fromDate}, ${fromTime} — ${
    fromDate !== toDate ? `${toDate}, ` : ""
  }${toTime}`;
  const isSelected = isPreviewMode && session.dateCreated === dateCreated;

  return (
    <Flex
      key={session.id}
      data-test-id={`session-item`}
      py={1}
      px={2}
      sx={{
        cursor: "pointer",
        bg: isSelected ? "background-selected" : "transparent",
        ":hover": {
          bg: isSelected ? "hover-selected" : "hover"
        },
        alignItems: "center",
        justifyContent: "space-between"
      }}
      title="Click to preview"
      onClick={async () => {
        const content = await db.noteHistory.content(session.id);
        if (!content) return;
        if (session.locked) {
          await Vault.askPassword(async (password) => {
            try {
              const decryptedContent = await db.vault.decryptContent(
                content,
                password
              );
              onOpenPreviewSession({
                content: decryptedContent,
                dateCreated: session.dateCreated,
                dateEdited: session.dateModified
              });
              return true;
            } catch (e) {
              return false;
            }
          });
        } else {
          onOpenPreviewSession({
            content: {
              data: content.data as string,
              type: content.type
            },
            dateCreated: session.dateCreated,
            dateEdited: session.dateModified
          });
        }
      }}
    >
      <Text variant={"body"} data-test-id="title">
        {label}
      </Text>
      <Flex
        sx={{
          fontSize: "subBody",
          color: "paragraph-secondary"
        }}
      >
        {session.locked && <Lock size={14} data-test-id="locked" />}
        <TimeAgo live datetime={session.dateModified} locale={"en_short"} />
      </Flex>
    </Flex>
  );
}
