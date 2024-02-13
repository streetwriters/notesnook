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
import { showPopup } from "../../../components/popup-presenter";
import { Editor } from "../../../types";
import { NodeWithOffset } from "../../../utils/prosemirror";
import { FloatingMenuProps } from "../types";
import { LinkHoverPopupHandler } from "./link";

export type HoverPopupProps = {
  editor: Editor;
  selectedNode: NodeWithOffset;
};

const handlers = [LinkHoverPopupHandler];

const HOVER_TIMEOUT = 500;

export function HoverPopupHandler(props: FloatingMenuProps) {
  const { editor } = props;
  const hoverTimeoutId = useRef<number>();
  const activePopup = useRef<{ element: HTMLElement; hide: () => void }>();

  useEffect(
    () => {
      function onMouseOver(e: MouseEvent) {
        if (
          !e.target ||
          !(e.target instanceof HTMLElement) ||
          e.target.classList.contains("ProseMirror")
        )
          return;

        const element = e.target;

        if (activePopup.current) {
          const isOutsideEditor = !element.closest(".ProseMirror");
          const isInsidePopup = element.closest(".popup-presenter-portal");
          const isActiveElement = activePopup.current.element === element;
          if (isInsidePopup) return;

          if (isOutsideEditor || !isActiveElement) {
            activePopup.current.hide();
            activePopup.current = undefined;
            return;
          }
        }

        clearTimeout(hoverTimeoutId.current);

        hoverTimeoutId.current = setTimeout(
          () => {
            const PopupHandler = handlers.find((h) => h.isActive(element));
            if (!PopupHandler || !editor.current) return;

            const { popup: Popup } = PopupHandler;
            const pos = editor.current.view.posAtDOM(element, 0);
            if (pos < 0) return;

            const node = editor.current.view.state.doc.nodeAt(pos);

            if (!node) return;

            const hidePopup = showPopup({
              popup: () => (
                <Popup
                  editor={editor}
                  selectedNode={{
                    node,
                    from: pos,
                    to: pos + node.nodeSize
                  }}
                />
              ),
              blocking: false,
              focusOnRender: false,
              position: {
                target: element,
                align: "center",
                location: "top",
                isTargetAbsolute: true
              }
            });
            activePopup.current = { element, hide: hidePopup };
          },
          HOVER_TIMEOUT,
          {}
        );
      }
      window.addEventListener("mouseover", onMouseOver);
      return () => {
        window.removeEventListener("mouseover", onMouseOver);
      };
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  return null;
}
