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

import { useRef, useState } from "react";
import { PopupWrapper } from "../../components/popup-presenter";
import { ToolButton } from "../components/tool-button";
import { useToolbarLocation } from "../stores/toolbar-store";
import { ToolProps } from "../types";
import { getToolbarElement } from "../utils/dom";
import { ToolId } from "../tools";
import { ToolbarGroup } from "./toolbar-group";
import { useCallback } from "react";

type MoreToolsProps = ToolProps & {
  popupId: string;
  tools: ToolId[];
  autoCloseOnUnmount?: boolean;
  autoOpen?: boolean;
  group?: string;
};
export function MoreTools(props: MoreToolsProps) {
  const { popupId, editor, tools, autoCloseOnUnmount, autoOpen, group } = props;
  const toolbarLocation = useToolbarLocation();
  const isBottom = toolbarLocation === "bottom";
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [isOpen, setIsOpen] = useState(autoOpen || false);
  const onClosed = useCallback(() => setIsOpen(false), [setIsOpen]);

  return (
    <>
      <ToolButton
        {...props}
        toggled={isOpen}
        buttonRef={buttonRef}
        onClick={() => setIsOpen((s) => !s)}
      />
      <PopupWrapper
        isOpen={isOpen}
        group={group || "toolbarGroup"}
        id={popupId}
        onClosed={onClosed}
        position={{
          isTargetAbsolute: true,
          target: isBottom ? getToolbarElement() : buttonRef.current || "mouse",
          align: "center",
          location: isBottom ? "top" : "below",
          yOffset: 10
        }}
        autoCloseOnUnmount={autoCloseOnUnmount}
        focusOnRender={false}
        blocking={false}
      >
        <ToolbarGroup
          tools={tools}
          editor={editor}
          sx={{
            flex: 1,
            boxShadow: "menu",
            bg: "background",
            borderRadius: "default",
            overflowX: "auto",
            maxWidth: "95vw"
          }}
        />
      </PopupWrapper>
    </>
  );
}
