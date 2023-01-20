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

import { Text } from "@theme-ui/components";
import { ReactNodeViewProps } from "../react";
import { useMemo } from "react";
import { OutlineListAttributes } from "./outline-list";
import { OutlineListItem } from "../outline-list-item";

export function OutlineListComponent(
  props: ReactNodeViewProps<OutlineListAttributes>
) {
  const { editor, getPos, node, forwardRef } = props;
  const { collapsed, textDirection } = node.attrs;

  const isNested = useMemo(() => {
    const pos = editor.state.doc.resolve(getPos());
    return pos.parent?.type.name === OutlineListItem.name;
  }, [editor, getPos]);

  return (
    <>
      <Text
        className="outline-list"
        as={"div"}
        ref={forwardRef}
        dir={textDirection}
        sx={{
          ul: {
            display: collapsed ? "none" : "block",
            paddingInlineStart: 0,
            paddingLeft: 0,
            marginBlockStart: isNested ? 5 : 0,
            marginBlockEnd: 0
          },
          li: {
            listStyleType: "none"
          }
        }}
      />
    </>
  );
}
