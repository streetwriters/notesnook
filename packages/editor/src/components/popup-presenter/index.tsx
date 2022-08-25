import {
  useCallback,
  useRef,
  useEffect,
  PropsWithChildren,
  ReactNode,
} from "react";
import { Box } from "rebass";
import { getPosition, PositionOptions } from "../../utils/position";
import Modal from "react-modal";
import ReactDOM from "react-dom";
import { Editor } from "@tiptap/core";
import { getPopupContainer, getToolbarElement } from "../../toolbar/utils/dom";
import { Theme } from "@streetwriters/theme";
import {
  useIsMobile,
  useToolbarStore,
} from "../../toolbar/stores/toolbar-store";
import React from "react";
import {
  EditorContext,
  PopupRenderer,
  usePopupRenderer,
} from "./popuprenderer";
import { ResponsivePresenter, ResponsivePresenterProps } from "../responsive";
import { ThemeProvider } from "../theme-provider";

export type PopupPresenterProps = {
  isOpen: boolean;
  onClose: () => void;
  position: PositionOptions;
  blocking?: boolean;
  focusOnRender?: boolean;
  movable?: boolean;
};

function _PopupPresenter(props: PropsWithChildren<PopupPresenterProps>) {
  const {
    isOpen,
    position,
    onClose,
    blocking = true,
    focusOnRender = true,
    children,
  } = props;

  const isMobile = useIsMobile();
  const contentRef = useRef<HTMLDivElement>();
  const observerRef = useRef<ResizeObserver>();

  const repositionPopup = useCallback(() => {
    if (!contentRef.current || !position) return;
    const popup = contentRef.current;
    const popupPosition = getPosition(popup, position);
    popup.style.top = popupPosition.top + "px";
    popup.style.left = popupPosition.left + "px";
  }, [position]);

  useEffect(() => {
    repositionPopup();
  }, [position]);

  useEffect(() => {
    function onWindowResize() {
      repositionPopup();
    }
    window.addEventListener("resize", onWindowResize);
    return () => {
      window.removeEventListener("resize", onWindowResize);
    };
  }, []);

  const attachMoveHandlers = useCallback(() => {
    if (!contentRef.current || !isOpen) return;
    const movableBar = contentRef.current.querySelector(
      ".movable"
    ) as HTMLElement;

    if (!movableBar) return;
    const popup = contentRef.current;

    var offset = { x: 0, y: 0 };
    function mouseDown(e: MouseEvent) {
      offset.x = e.clientX - popup.offsetLeft;
      offset.y = e.clientY - popup.offsetTop;
      window.addEventListener("mousemove", mouseMove);
    }

    function mouseMove(e: MouseEvent) {
      if (!e.buttons) mouseUp();
      var top = e.clientY - offset.y;
      var left = e.clientX - offset.x;
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
    observerRef.current = new ResizeObserver((e) => {
      if (isMobile) {
        repositionPopup();
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
  }, [isMobile]);

  return (
    <Modal
      contentRef={(ref) => (contentRef.current = ref)}
      className={"popup-presenter"}
      role="menu"
      isOpen={isOpen}
      appElement={document.body}
      shouldCloseOnEsc
      shouldReturnFocusAfterClose
      shouldCloseOnOverlayClick
      shouldFocusAfterRender={focusOnRender}
      ariaHideApp={blocking}
      preventScroll={blocking}
      onRequestClose={onClose}
      portalClassName={"popup-presenter-portal"}
      onAfterOpen={(obj) => {
        if (!obj || !position) return;
        repositionPopup();

        handleResize();
        attachMoveHandlers();
      }}
      onAfterClose={() => observerRef.current?.disconnect()}
      overlayElement={(props, contentEl) => {
        return (
          <Box
            {...props}
            //@ts-ignore
            style={{
              ...props.style,
              position: !blocking ? "initial" : "fixed",
              zIndex: 1000,
              backgroundColor: !blocking ? "transparent" : "unset",
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
            isolation: "isolate",
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
        },
      }}
    >
      {children}
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

export type PopupWrapperProps = UsePopupHandlerOptions & {
  autoCloseOnUnmount?: boolean;
  position: PositionOptions;
  renderPopup: (closePopup: () => void) => React.ReactNode;
} & Partial<Omit<PopupPresenterProps, "onClose">>;
export function PopupWrapper(props: PopupWrapperProps) {
  let {
    id,
    group,
    position,
    renderPopup,
    isOpen,
    onClosed,
    autoCloseOnUnmount,
    ...presenterProps
  } = props;
  const PopupRenderer = usePopupRenderer();
  const { closePopup, isPopupOpen } = usePopupHandler(props);

  useEffect(() => {
    if (!autoCloseOnUnmount) return;
    return () => {
      PopupRenderer?.closePopup(id);
    };
  }, [autoCloseOnUnmount, id, PopupRenderer]);

  useEffect(() => {
    if (PopupRenderer && isPopupOpen) {
      PopupRenderer.openPopup(id, function Popup({ id }) {
        const isPopupOpen = useToolbarStore(
          (store) => !!store.openedPopups[id]
        );

        useEffect(() => {
          if (!isPopupOpen) {
            PopupRenderer.closePopup(id);
          }
        }, [isPopupOpen]);

        return (
          <PopupPresenter
            key={id}
            isOpen={isPopupOpen}
            onClose={() => closePopup(id)}
            position={position}
            blocking
            focusOnRender
            {...presenterProps}
          >
            <Box
              sx={{
                boxShadow: "menu",
                borderRadius: "default",
                overflow: "hidden",
                //          width,
              }}
            >
              <EditorContext.Consumer>
                {() => {
                  return renderPopup(() => PopupRenderer.closePopup(id));
                }}
              </EditorContext.Consumer>
            </Box>
          </PopupPresenter>
        );
      });
    }
  }, [PopupRenderer, isPopupOpen]);

  return null;
}

type UsePopupHandlerOptions = {
  id: string;
  group: string;
  isOpen: boolean;
  onClosed?: () => void;
};
export function usePopupHandler(options: UsePopupHandlerOptions) {
  let { group, isOpen, id, onClosed } = options;

  const isPopupOpen = useToolbarStore((store) => !!store.openedPopups[id]);
  const openPopup = useToolbarStore((store) => store.openPopup);
  const closePopup = useToolbarStore((store) => store.closePopup);
  const closePopupGroup = useToolbarStore((store) => store.closePopupGroup);

  const isBottom = useToolbarStore(
    (store) => store.toolbarLocation === "bottom"
  );

  if (isBottom) group = "popup";

  useEffect(() => {
    if (isOpen) openPopup({ id, group });
    else closePopup(id);
  }, [isOpen, id, group, openPopup, closePopup]);

  useEffect(() => {
    if (!isPopupOpen) onClosed?.();
  }, [isPopupOpen]);

  useEffect(() => {
    if (isPopupOpen) {
      closePopupGroup(group, [id]);
    }
  }, [onClosed, isPopupOpen, closePopupGroup, id, group]);

  useEffect(() => {
    if (!isOpen) closePopup(id);
  }, [isOpen, id, group, closePopup]);

  return { isPopupOpen, closePopup };
}

type ShowPopupOptions = {
  popup: (closePopup: () => void) => React.ReactNode;
} & Partial<ResponsivePresenterProps>;
export function showPopup(options: ShowPopupOptions) {
  const { popup, ...props } = options;

  function hide() {
    ReactDOM.unmountComponentAtNode(getPopupContainer());
  }

  ReactDOM.render(
    <ThemeProvider>
      <ResponsivePresenter
        isOpen
        position={{
          target: getToolbarElement(),
          isTargetAbsolute: true,
          location: "below",
          align: "end",
          yOffset: 10,
        }}
        blocking
        focusOnRender
        {...props}
        onClose={() => {
          hide();
          props.onClose?.();
        }}
      >
        {popup(hide)}
      </ResponsivePresenter>
    </ThemeProvider>,
    getPopupContainer()
  );

  return hide;
}
