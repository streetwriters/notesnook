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

import { memo } from "react";
import { formatDate, type NoteResolvedData } from "@notesnook/common";
import type { Note as NoteType } from "@notesnook/core";
import { dataColor, Flex, Text, type SxProp } from "@ui";
import { useEditorStore } from "../../stores/editor-store";
import { useStore as useSettingStore } from "../../stores/setting-store";
import { Calendar, Circle, Lock } from "../icons";
import ListItem from "../list-item";
import type { Context } from "../list-container/types";

type NoteProps = NoteResolvedData & {
  item: NoteType;
  context?: Context;
  date: number;
  index?: number;
  compact?: boolean;
  sx?: SxProp;
};

function Note(props: NoteProps) {
  const { tags, color, notebooks, locked, item, date, compact, sx } = props;
  const note = item;
  const primary = color ? dataColor(color.colorCode) : undefined;
  const isOpened = useEditorStore((store) => store.isNoteOpen(item.id));
  const dateFormat = useSettingStore((store) => store.dateFormat);
  const hasMetadata =
    !compact && ((tags?.items.length ?? 0) > 0 || notebooks?.items.length);

  return (
    <ListItem
      index={props.index}
      isFocused={isOpened}
      isCompact={compact}
      item={note}
      title={
        <Flex sx={{ alignItems: "center", gap: "spacing3", minWidth: 0 }}>
          {primary ? <Circle size={10} color={primary} /> : null}
          <Text
            testID="title"
            numberOfLines={1}
            sx={{
              color: "heading",
              minWidth: 0,
              fontWeight: 600,
              fontSize: compact ? "xs" : "sm"
            }}
          >
            {note.title}
          </Text>
        </Flex>
      }
      body={!compact && note.headline ? note.headline : undefined}
      onPress={() => useEditorStore.getState().openSession(note)}
      sx={{
        py: "spacing4",
        px: "spacing6",
        gap: "spacing4",
        borderBottom: "1px solid",
        borderBottomColor: "border",
        borderLeft: "2px solid",
        borderLeftColor: isOpened
          ? primary ?? "accent-selected"
          : "transparent",
        ...sx
      }}
      header={
        hasMetadata ? (
          <Flex
            sx={{
              alignItems: "center",
              flexWrap: "wrap",
              gap: "spacing2",
              minWidth: 0
            }}
          >
            {notebooks?.items.map((notebook) => (
              <Chip key={notebook.id} text={notebook.title} />
            ))}
            {tags?.items.map((tag) => (
              <Chip key={tag.id} text={`#${tag.title}`} />
            ))}
          </Flex>
        ) : undefined
      }
      footer={
        <Flex
          sx={{
            alignItems: "center",
            flexShrink: 0,
            gap: "spacing2",
            justifyContent: compact ? "flex-end" : "flex-start"
          }}
        >
          {locked ? <Lock size={11} color="icon" /> : null}
          {compact ? null : <Calendar size={12} color="icon-secondary" />}
          <Text
            testID="date"
            sx={{
              color: "paragraph-secondary",
              fontSize: "3xs",
              fontWeight: "medium"
            }}
          >
            {formatDate(date, { type: "date", dateFormat })}
          </Text>
        </Flex>
      }
    />
  );
}

function Chip({ text }: { text: string }) {
  return (
    <Flex
      sx={{
        alignItems: "center",
        px: "spacing3",
        py: 1,
        borderRadius: "small",
        bg: "background-secondary"
      }}
    >
      <Text
        numberOfLines={1}
        sx={{ color: "paragraph-secondary", fontSize: "3xs" }}
      >
        {text}
      </Text>
    </Flex>
  );
}

export default memo(Note, function (prev, next) {
  return (
    prev.compact === next.compact &&
    prev.date === next.date &&
    prev.item.dateModified === next.item.dateModified &&
    prev.item.title === next.item.title &&
    prev.item.headline === next.item.headline &&
    prev.tags?.dateEdited === next.tags?.dateEdited &&
    prev.notebooks?.dateEdited === next.notebooks?.dateEdited &&
    prev.locked === next.locked
  );
});
