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

import type { Note } from "@notesnook/core";
import { Flex, Text, type SxProp } from "@ui";
import { formatDate } from "@notesnook/common";

export function NoteReference(props: {
  item: Pick<Note, "id" | "title" | "headline">;
  date?: number;
  onPress?: () => void;
  sx?: SxProp;
}) {
  return (
    <Flex
      testID="note-reference"
      onPress={props.onPress}
      sx={{
        flexDirection: "column",
        p: "spacing4",
        gap: "spacing2",
        ":hover": props.onPress ? { bg: "hover" } : undefined,
        ...props.sx
      }}
    >
      <Text variant="subtitle" numberOfLines={1} sx={{ color: "heading" }}>
        {props.item.title}
      </Text>
      {props.date ? (
        <Text variant="subBody">{formatDate(props.date)}</Text>
      ) : null}
    </Flex>
  );
}
