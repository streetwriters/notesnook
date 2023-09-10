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

import { ToolbarGroup } from "../../components/toolbar-group";
import { HoverPopupProps } from ".";

function LinkHoverPopup(props: HoverPopupProps) {
  const { editor, selectedNode } = props;
  const { node } = selectedNode;

  if (
    !node?.isText ||
    node.marks.length <= 0 ||
    !node.marks.some((mark) => mark.type.name === "link")
  )
    return null;

  return (
    <ToolbarGroup
      force
      tools={["openLink", "editLink", "removeLink", "copyLink"]}
      editor={editor}
      selectedNode={selectedNode}
      sx={{
        bg: "background",
        boxShadow: "menu",
        borderRadius: "default",
        p: 1
      }}
    />
  );
}

export const LinkHoverPopupHandler = {
  isActive: (e: HTMLElement) => !!e.closest("a"),
  popup: LinkHoverPopup
};
