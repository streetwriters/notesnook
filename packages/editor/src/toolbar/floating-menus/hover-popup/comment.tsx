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

import { ToolbarGroup } from "../../components/toolbar-group.js";
import { HoverPopupProps } from "./index.js";
import { useHoverPopupContext } from "./context.js";
import { ToolbarGroupDefinition } from "../../types.js";

const COMMENT_TOOLS: ToolbarGroupDefinition = ["viewComment"];

function CommentHoverPopup(props: HoverPopupProps) {
  const { editor } = props;
  const { selectedNode } = useHoverPopupContext();
  const { node } = selectedNode || {};

  if (
    !node?.isText ||
    node.marks.length <= 0 ||
    !node.marks.some((mark) => mark.type.name === "comment")
  ) {
    return null;
  }

  return (
    <ToolbarGroup
      force
      tools={COMMENT_TOOLS}
      groupId={"commentHoverTools"}
      editor={editor}
      sx={{
        bg: "background",
        boxShadow: "menu",
        borderRadius: "default",
        p: 1
      }}
    />
  );
}

export const CommentHoverPopupHandler = {
  isActive: (e: HTMLElement) => !!e.closest("[data-comment-id]"),
  popup: CommentHoverPopup,
  openOnClick: true
};
