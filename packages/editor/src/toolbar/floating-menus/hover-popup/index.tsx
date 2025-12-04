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
import { showPopup } from "../../../components/popup-presenter/index.js";
import { Editor } from "../../../types.js";
import { FloatingMenuProps } from "../types.js";
import { LinkHoverPopupHandler } from "./link.js";
import { CommentHoverPopupHandler } from "./comment.js";
import { HoverPopupContextProvider } from "./context.js";

export type HoverPopupProps = {
  editor: Editor;
};

type HoverPopupHandler = {
  isActive: (element: HTMLElement) => boolean;
  popup: (props: HoverPopupProps) => React.ReactNode;
  openOnClick?: boolean;
};

const handlers: HoverPopupHandler[] = [
  LinkHoverPopupHandler,
  CommentHoverPopupHandler
];

const HOVER_TIMEOUT = 1000;

export function HoverPopupHandler(props: FloatingMenuProps) {
  const { editor } = props;
  const hoverTimeoutId = useRef<number>();
  const activePopup = useRef<{ element: HTMLElement; hide: () => void }>();

  useEffect(() => {
    function onDestroy() {
      activePopup.current?.hide();
    }
    editor.on("destroy", onDestroy);
    return () => {
      editor.off("destroy", onDestroy);
    };
  }, []);

  useEffect(
    () => {
      function onContextMenu(e: MouseEvent) {
        if (
          !e.target ||
          !(e.target instanceof HTMLElement) ||
          e.target.classList.contains("ProseMirror")
        )
          return;

        clearTimeout(hoverTimeoutId.current);
      }

      function showPopupForElement(
        element: HTMLElement,
        timeout: number = HOVER_TIMEOUT
      ) {
        clearTimeout(hoverTimeoutId.current);

        hoverTimeoutId.current = setTimeout(
          () => {
            const PopupHandler = handlers.find((h) => h.isActive(element));
            if (
              !PopupHandler ||
              !editor ||
              !editor.view ||
              editor.view.isDestroyed
            )
              return;

            const { popup: Popup } = PopupHandler;

            const pos = editor.view.posAtDOM(element, 0);
            if (pos < 0) return;

            const node = editor.view.state.doc.nodeAt(pos);
            if (!node) return;

            const hidePopup = showPopup({
              popup: () => (
                <HoverPopupContextProvider
                  value={{
                    selectedNode: {
                      node,
                      from: pos,
                      to: pos + node.nodeSize
                    },
                    hide: () => hidePopup()
                  }}
                >
                  <Popup editor={editor} />
                </HoverPopupContextProvider>
              ),
              blocking: false,
              focusOnRender: false,
              position: {
                target: "mouse",
                align: "start",
                location: "top",
                isTargetAbsolute: true,
                yOffset: 0,
                xOffset: -30
              }
            });
            activePopup.current = { element, hide: hidePopup };
          },
          timeout,
          {}
        );
      }

      function onClick(e: MouseEvent) {
        if (
          !e.target ||
          !(e.target instanceof HTMLElement) ||
          e.target.classList.contains("ProseMirror")
        )
          return;

        const element = e.target;

        const handler = handlers.find((h) => h.isActive(element));
        if (!handler?.openOnClick) return;

        if (activePopup.current?.element === element) return;

        if (activePopup.current) {
          activePopup.current.hide();
          activePopup.current = undefined;
        }

        showPopupForElement(element, 0);
      }

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

          if (isOutsideEditor) {
            activePopup.current.hide();
            activePopup.current = undefined;
            return;
          }

          if (!isActiveElement) {
            activePopup.current.hide();
            activePopup.current = undefined;
          } else {
            return;
          }
        }

        showPopupForElement(element);
      }

      window.addEventListener("mouseover", onMouseOver);
      window.addEventListener("click", onClick);
      window.addEventListener("contextmenu", onContextMenu);
      return () => {
        window.removeEventListener("mouseover", onMouseOver);
        window.removeEventListener("click", onClick);
        window.removeEventListener("contextmenu", onContextMenu);
      };
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  return null;
}
