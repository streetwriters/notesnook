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
import { Flex, Text } from "@ui";

type Variant =
  | "home"
  | "favorite"
  | "archive"
  | "monographs"
  | "tag"
  | "search"
  | "trash"
  | "reminders";

function textFor(variant: Variant) {
  switch (variant) {
    case "favorite":
      return strings.favoritesEmpty();
    case "monographs":
      return strings.monographsEmpty();
    case "tag":
      return strings.tagsEmpty();
    case "reminders":
      return strings.remindersEmpty();
    case "search":
      return strings.noResultsFound();
    default:
      return strings.notesEmpty();
  }
}

export function ListPanePlaceholder({ variant }: { variant: Variant }) {
  return (
    <Flex sx={{ flexDirection: "column", width: "100%", alignItems: "center" }}>
      <Text
        testID="placeholder-text"
        sx={{ color: "paragraph", fontSize: "sm" }}
      >
        {textFor(variant)}
      </Text>
    </Flex>
  );
}
