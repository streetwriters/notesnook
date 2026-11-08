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

import { Flex, Input } from "@ui";
import { Funnel } from "../icons";

export function FilterField(props: {
  placeholder: string;
  onChangeText?: (text: string) => void;
}) {
  return (
    <Flex
      sx={{
        flexDirection: "row",
        alignItems: "center",
        borderTop: "1px solid",
        borderTopColor: "separator",
        mx: "spacing4",
        pt: "spacing4"
      }}
    >
      <Input
        testID="filter-input"
        variant="clean"
        placeholder={props.placeholder}
        onChangeText={props.onChangeText}
        sx={{
          flex: 1,
          minWidth: 0,
          p: 0,
          height: 16,
          fontSize: "xs",
          color: "paragraph"
        }}
      />
      <Funnel size={13} color="icon-secondary" />
    </Flex>
  );
}
