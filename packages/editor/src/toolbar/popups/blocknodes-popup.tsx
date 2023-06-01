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
import { useToolbarStore } from "../stores/toolbar-store";
import { showPopup } from "../../components/popup-presenter";
import { Editor } from "../../types";
import { MenuItem } from "../../components/menu/types";
import { getToolbarElement } from "../utils/dom";
import { getAllTools } from "../tool-definitions";

export const ShowBlockNodesComponent = (props: {
  editor: Editor;
  selectedElement: HTMLElement;
}) => {
  const { editor, selectedElement } = props;
  const items = toMenuItems(editor);
  const toolbarLocation = useToolbarStore.getState().toolbarLocation;
  const isMobile = useToolbarStore.getState().isMobile;
  const isBottom = toolbarLocation === "bottom";
  const xOffset = isBottom ? 0 : -selectedElement.offsetWidth / 2 + 75;

  showPopup({
    items: items,
    position: {
      target: isBottom ? getToolbarElement() : selectedElement,
      isTargetAbsolute: true,
      location: isBottom ? "top" : "below",
      align: "center",
      yOffset: 0,
      xOffset: xOffset
    },
    blocking: !isMobile,
    focusOnRender: !isMobile,
    sx: {
      minWidth: 150,
      maxWidth: isBottom ? "95vw" : "auto",
      flexDirection: isBottom ? "row" : "column",
      overflowX: isBottom ? "auto" : "hidden",
      marginRight: isBottom ? "10px" : 0,
      display: "flex",
      alignItems: isBottom ? "center" : "unset"
    },
    onFocus: () => {
      console.log("on foucs");
    },
    onBlur: () => {
      console.log("on bluur");
    }
  });
};

const blocknodes = [
  { id: "table", title: "Table" },
  { id: "outline-list", title: "Outline list" },
  { id: "task-list", title: "Task list" },
  { id: "bullet-list", title: "Bullet list" },
  { id: "ordered-list", title: "Ordered list" },
  { id: "block-quote", title: "Quote" },
  { id: "code-block", title: "Code block" }
];

function toMenuItems(editor: Editor): MenuItem[] {
  const menuItems: MenuItem[] = [];
  for (const blocknode of blocknodes) {
    menuItems.push({
      key: blocknode.id,
      type: "button",
      title: blocknode.title,
      onClick: () => {
        console.log(getAllTools());
        editor.current?.chain().focus().insertContent(" ").run();

        switch (blocknode.id) {
          case "table":
            editor.current
              ?.chain()
              .focus()
              .insertTable({ rows: 3, cols: 3 })
              .run();
            break;
          case "outline-list":
            editor.current?.chain().focus().toggleOutlineList().run();
            break;
          case "task-list":
            editor.current?.chain().focus().toggleTaskList().run();
            break;
          case "bullet-list":
            editor.current?.chain().focus().toggleBulletList().run();
            break;
          case "ordered-list":
            editor.current?.chain().focus().toggleOrderedList().run();
            break;
          case "block-quote":
            editor.current?.chain().focus().setBlockquote().run();
            break;
          case "code-block":
            editor.current?.chain().focus().toggleCodeBlock().run();
            break;
        }
        editor.current?.off("update");
      }
    });
  }
  return menuItems;
}
