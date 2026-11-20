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

import { useEffect, useRef } from "react";
import type { UIElement } from "@ui";
import { PopupWrapper } from "../../components/popup-presenter/index.js";
import { ToolButton } from "../components/tool-button.js";
import {
  toolbarRef,
  usePopupManager,
  useToolbarLocation
} from "../stores/toolbar-store.js";
import type { TiptapToolProps, ToolProps } from "../types.js";
import type { EditorController } from "../../controller.js";
import { ToolId } from "../tools/index.js";
import { ControllerToolbarGroup } from "./toolbar-group.js";
import { strings } from "@notesnook/intl";

type MoreToolsProps = Omit<ToolProps, "editor"> & {
  editor: EditorController | TiptapToolProps["editor"];
  controller?: EditorController;
  popupId: string;
  tools: ToolId[];
  autoCloseOnUnmount?: boolean;
  autoOpen?: boolean;
  group?: string;
};
export function MoreTools(props: MoreToolsProps) {
  const { popupId, tools, autoCloseOnUnmount, autoOpen } = props;
  const editor = props.controller ?? (props.editor as EditorController);
  const toolbarLocation = useToolbarLocation();
  const isBottom = toolbarLocation === "bottom";
  const group = isBottom ? "mobile" : "toolbarGroup";
  const buttonRef = useRef<UIElement>(null);
  const { open, toggle, isOpen, isPinned, togglePinned } = usePopupManager({
    id: popupId,
    group
  });

  useEffect(() => {
    if (autoOpen) {
      open();
      togglePinned();
    }
  }, [autoOpen]);

  return (
    <>
      <ToolButton
        icon={props.icon}
        title={props.title}
        toggled={isOpen}
        buttonRef={buttonRef}
        onClick={toggle}
      />
      <PopupWrapper
        group={group}
        id={popupId}
        anchorRef={isBottom ? toolbarRef : buttonRef}
        placement={isBottom ? "top-start" : "bottom-start"}
        autoCloseOnUnmount={autoCloseOnUnmount}
        sx={{
          flexDirection: "row",
          alignItems: "center",
          bg: "background",
          p: 1,
          borderRadius: "default"
        }}
      >
        <ControllerToolbarGroup
          tools={tools}
          editor={editor}
          groupId={popupId}
          sx={{
            p: 0,
            borderRight: autoOpen ? "none" : "1px solid",
            borderRightColor: "border",
            pr: autoOpen ? 0 : 1,
            mr: autoOpen ? 0 : 1
          }}
        />
        {autoOpen ? null : (
          <ToolButton
            toggled={isPinned}
            onClick={togglePinned}
            icon="pin"
            title={isPinned ? strings.unpin() : strings.pin()}
            variant="small"
          />
        )}
      </PopupWrapper>
    </>
  );
}
