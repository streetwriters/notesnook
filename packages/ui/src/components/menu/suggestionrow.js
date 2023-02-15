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

import { Button, Text } from "@theme-ui/components";

export function SuggestionRow(props) {
  return (
    <Button
      id={`suggestionItem_${props.index}`}
      variant="menuitem"
      m={0}
      sx={{
        display: "flex",
        ":focus": { bg: "hover" },
        width: "100%",
        alignItems: "flex-start"
      }}
      bg="green"
      px={2}
      {...props}
    >
      <Text
        variant="subtitle"
        fontWeight={props.item.isFilterFocused ? "body" : "bold"}
        ml={1}
        sx={{ textOverflow: "ellipsis" }}
      >
        {props.item.col1}
      </Text>
      <Text
        variant="subtitle"
        fontWeight={"body"}
        ml={1}
        sx={{ textOverflow: "ellipsis" }}
      >
        {props.item.col2}
      </Text>
    </Button>
  );
}
