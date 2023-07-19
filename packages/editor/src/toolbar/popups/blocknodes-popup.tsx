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

export const ShowBlockNodesComponent = (props: {
  editor: Editor;
  selectedElement: HTMLElement;
  items: MenuItem[];
}) => {
  const { editor, selectedElement, items } = props;
  //const items = toMenuItems(editor);
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
    onClose: () => {
      editor.current?.off("update");
    }
  });
};
