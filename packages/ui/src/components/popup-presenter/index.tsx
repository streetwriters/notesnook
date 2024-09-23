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

import { useCallback, useRef, useEffect, PropsWithChildren } from "react";
import { Box, BoxProps } from "@theme-ui/components";
import { getPosition, PositionOptions } from "../../utils/position.js";
import Modal from "react-modal";
import { EmotionThemeProvider, ThemeScopes } from "@notesnook/theme";

export type PopupPresenterProps = {
  isOpen: boolean;
  onClose: () => void;
  position: PositionOptions;
  blocking?: boolean;
  focusOnRender?: boolean;
  movable?: boolean;
  scope?: keyof ThemeScopes;
  isMobile?: boolean;
  container?: HTMLElement;
} & BoxProps;

function _PopupPresenter(props: PropsWithChildren<PopupPresenterProps>) {
  const {
    isOpen,
    position,
    onClose,
    blocking = true,
    focusOnRender = true,
    children,
    scope,
    isMobile,
    container,
    ...restProps
  } = props;

  const contentRef = useRef<HTMLDivElement>();
  const observerRef = useRef<ResizeObserver>();

  const repositionPopup = useCallback((position: PositionOptions) => {
    if (!contentRef.current || !position) return;
    const popup = contentRef.current;
    const popupPosition = getPosition(popup, position);
    popup.style.top = popupPosition.top + "px";
    popup.style.left = popupPosition.left + "px";
  }, []);

  useEffect(() => {
    repositionPopup(position);
  }, [repositionPopup, position]);

  useEffect(() => {
    function onWindowResize() {
      if (!position.target || position.target === "mouse") return;
      repositionPopup(position);
    }
    window.addEventListener("resize", onWindowResize);
    return () => {
      window.removeEventListener("resize", onWindowResize);
    };
  }, [repositionPopup, position]);

  const attachMoveHandlers = useCallback(() => {
    if (!contentRef.current || !isOpen) return;
    const movableBar = contentRef.current.querySelector(
      ".movable"
    ) as HTMLElement;

    if (!movableBar) return;
    const popup = contentRef.current;

    const offset = { x: 0, y: 0 };
    function mouseDown(e: MouseEvent) {
      offset.x = e.clientX - popup.offsetLeft;
      offset.y = e.clientY - popup.offsetTop;
      window.addEventListener("mousemove", mouseMove);
    }

    function mouseMove(e: MouseEvent) {
      if (!e.buttons) mouseUp();
      const top = e.clientY - offset.y;
      const left = e.clientX - offset.x;
      requestAnimationFrame(() => {
        popup.style.top = top + "px";
        popup.style.left = left + "px";
      });
    }

    function mouseUp() {
      window.removeEventListener("mousemove", mouseMove);
    }

    movableBar.addEventListener("mousedown", mouseDown);
    window.addEventListener("mouseup", mouseUp);
  }, [isOpen]);

  const handleResize = useCallback(() => {
    const popup = contentRef.current;
    if (!popup) return;

    let oldHeight: number = popup.offsetHeight;
    observerRef.current = new ResizeObserver(() => {
      if (isMobile) {
        repositionPopup(position);
      } else {
        const { height, y } = popup.getBoundingClientRect();
        const delta = height - oldHeight;
        if (delta > 0) {
          // means the new size is bigger so we need to adjust the position
          // if required. We only do this in case the newly resized popup
          // is going out of the window.

          const windowHeight = document.body.clientHeight - 20;
          if (y + height > windowHeight) {
            popup.style.top = windowHeight - height + "px";
          }
        }
        oldHeight = height;
      }
    });
    observerRef.current.observe(popup, { box: "border-box" });
  }, [repositionPopup, position, isMobile]);

  return (
    <Modal
      contentRef={(ref) => (contentRef.current = ref)}
      className={"popup-presenter"}
      role="menu"
      isOpen={isOpen}
      appElement={container || document.body}
      parentSelector={() => container || document.body}
      shouldCloseOnEsc
      shouldReturnFocusAfterClose
      shouldCloseOnOverlayClick
      shouldFocusAfterRender={focusOnRender}
      ariaHideApp={blocking}
      preventScroll={blocking}
      onRequestClose={onClose}
      portalClassName={"popup-presenter-portal"}
      onAfterOpen={(obj) => {
        Modal.setAppElement(container || document.body);
        if (!obj || !position) return;
        repositionPopup(position);

        handleResize();
        attachMoveHandlers();
      }}
      onAfterClose={() => observerRef.current?.disconnect()}
      overlayElement={(props, contentEl) => {
        return (
          <Box
            {...props}
            style={{
              ...props.style,
              position: !blocking ? "initial" : "fixed",
              zIndex: 1000,
              backgroundColor: !blocking ? "transparent" : "unset"
            }}
            // onClick={(e) => {
            //   if (!(e.target instanceof HTMLElement)) return;
            //   console.log(e.target.closest(".ReactModal__Content"));
            //   if (e.target.closest(".ReactModal__Content")) return;
            //   onClose();
            // }}
            // onContextMenu={(e) => {
            //   e.preventDefault();
            //   onClose();
            // }}
          >
            {contentEl}
          </Box>
        );
      }}
      contentElement={(props, children) => (
        <Box
          {...props}
          style={{}}
          // TODO onMouseDown={(e) => {
          //   console.log(e);
          // }}
          sx={{
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: "flex",
            width: "fit-content",
            height: "fit-content",
            position: "fixed",
            backgroundColor: undefined,
            padding: 0,
            zIndex: 999,
            outline: 0,
            opacity: `1 !important`,
            isolation: "isolate"
          }}
        >
          {children}
        </Box>
      )}
      style={{
        content: {},
        overlay: {
          zIndex: 999,
          background: "transparent",
          opacity: 1
        }
      }}
    >
      <EmotionThemeProvider scope={scope} {...restProps}>
        {children}
      </EmotionThemeProvider>
    </Modal>
  );
}

export function PopupPresenter(props: PropsWithChildren<PopupPresenterProps>) {
  // HACK: we don't want to render the popup presenter for no reason
  // including it's effects etc. so we just wrap it and return null
  // if the popup is closed.
  if (!props.isOpen) return null;

  return <_PopupPresenter {...props} />;
}
