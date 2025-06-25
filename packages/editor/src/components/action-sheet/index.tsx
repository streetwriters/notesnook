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

import React, {
  PropsWithChildren,
  useCallback,
  useRef,
  useState,
  useEffect
} from "react";
import { MenuItem, Icon, MenuButton, MenuSeparator } from "@notesnook/ui";
import { Box, Button, Flex, Text } from "@theme-ui/components";
import { Icons } from "../../toolbar/icons.js";
import Modal from "react-modal";
import { useTheme } from "@emotion/react";
import { EmotionThemeProvider, Theme } from "@notesnook/theme";

type ActionSheetHistoryItem = {
  title?: string;
  items?: MenuItem[];
};

function useHistory<T>(initial: T) {
  const [current, setCurrent] = useState<T | undefined>(initial);
  const [canGoBack, setCanGoBack] = useState(false);
  const stack = useRef<T[]>([initial]);

  const goBack = useCallback(() => {
    if (!canGoBack) return;
    const prev = stack.current.pop();
    setCurrent(prev);
    if (stack.current.length <= 1) setCanGoBack(false);
  }, [canGoBack]);

  const navigate = useCallback((state: T) => {
    setCurrent((prev) => {
      if (prev) stack.current.push(prev);
      return state;
    });

    setCanGoBack(true);
  }, []);

  return { current, goBack, navigate, canGoBack };
}

export type ActionSheetPresenterProps = {
  items?: MenuItem[];
  isOpen: boolean;
  onClose?: () => void;
  blocking?: boolean;
  focusOnRender?: boolean;
  draggable?: boolean;
  title?: string;
};

export function ActionSheetPresenter(
  props: PropsWithChildren<ActionSheetPresenterProps>
) {
  const {
    isOpen,
    title,
    items,
    onClose,
    blocking = true,
    focusOnRender = true,
    draggable = true,
    children
  } = props;
  const theme = useTheme() as Theme;
  const contentRef = useRef<HTMLDivElement>();
  const pressed = useRef(false);
  const startY = useRef(0);
  const reverse = false;
  const threshold = 50;
  const sheetTransition = "transform 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)";
  const animationRef = useRef(0);
  const masterOffset = useRef(0);
  const sheetRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  const onSwipeMove = (event: React.TouchEvent<HTMLDivElement>): void => {
    if (pressed.current) {
      const offset = event.touches[0].clientY - startY.current;
      move(offset);
    }
  };

  const onMouseMove = (
    event: React.MouseEvent<HTMLDivElement, MouseEvent>
  ): void => {
    event.stopPropagation();
    if (pressed.current) {
      if (reverse) {
        const offset = event.clientY - startY.current;
        move(offset);
      } else {
        const offset = event.clientY - startY.current;
        move(offset);
      }
    }
  };

  const move = (offset: number): boolean => {
    if (!reverse && offset > 0) {
      masterOffset.current = offset;
      animationRef.current = requestAnimationFrame(updatePosition);
      return true;
    } else if (reverse && offset < 0) {
      masterOffset.current = offset;
      animationRef.current = requestAnimationFrame(updatePosition);
      return true;
    }
    return false;
  };

  const updatePosition = (): boolean => {
    if (animationRef.current !== undefined) {
      if (sheetRef.current) {
        sheetRef.current.style.transform = `translate3d(0, ${masterOffset.current}px, 0)`;
        if (overlayRef.current)
          overlayRef.current.style.opacity = `${
            1 - masterOffset.current / sheetRef.current.offsetHeight
          }`;
        return true;
      }
      return false;
    }
    return false;
  };

  const onSwipeStart = (event: React.TouchEvent<HTMLDivElement>): void => {
    if (sheetRef?.current) sheetRef.current.style.transition = "none";
    startY.current = event.touches[0].clientY;
    changePressed(true);
  };

  const onMouseStart = (
    event: React.MouseEvent<HTMLDivElement, MouseEvent>
  ): void => {
    if (sheetRef?.current) sheetRef.current.style.transition = "none";
    startY.current = event.clientY;
    changePressed(true);
  };

  const changePressed = (x: boolean): void => {
    pressed.current = x;
  };

  const requestSheetDown = React.useCallback((): boolean => {
    if (sheetRef.current) {
      sheetRef.current.style.transition = sheetTransition;
      sheetRef.current.style.transform = reverse
        ? "translate3d(0, -101%, 0)"
        : "translate3d(0, 101%, 0)";
      if (overlayRef.current) overlayRef.current.style.opacity = `0`;
      return true;
    }
    return false;
  }, [reverse, sheetTransition]);

  const requestSheetUp = React.useCallback((): boolean => {
    if (sheetRef.current) {
      sheetRef.current.style.transform = `translate3d(0, 0%, 0)`;
      if (overlayRef.current) overlayRef.current.style.opacity = `1`;
      return true;
    }
    return false;
  }, []);

  const onSwipeEnd = (): void => {
    cancelAnimationFrame(animationRef.current);
    changePressed(false);
    if (Math.abs(masterOffset.current) > threshold) {
      // setShow(false);
      requestSheetDown();
      console.log("CLSOING", masterOffset.current);
      setTimeout(() => {
        if (onClose) onClose();
      }, 300);
    } else {
      requestSheetUp();
    }
    masterOffset.current = 0;
  };

  const onBeforeClose = useCallback(() => {
    requestSheetDown();
    setTimeout(() => {
      if (onClose) onClose();
    }, 300);
  }, [onClose, requestSheetDown]);

  const handleBackPress = useCallback(
    (event: Event) => {
      if (!isOpen) return;
      event.preventDefault();
      onBeforeClose();
    },
    [isOpen, onBeforeClose]
  );

  useEffect(() => {
    // Note: this is a custom event implemented on the React Native
    // side to handle back button when action sheet is opened.
    window.addEventListener("handleBackPress", handleBackPress);
    return () => {
      window.removeEventListener("handleBackPress", handleBackPress);
    };
  }, [handleBackPress]);

  if (!isOpen) return null;
  return (
    <Modal
      contentRef={(ref) => (contentRef.current = ref)}
      className={"bottom-sheet-presenter"}
      role="menu"
      isOpen={isOpen}
      appElement={document.body}
      shouldCloseOnEsc={blocking}
      shouldReturnFocusAfterClose={focusOnRender}
      shouldCloseOnOverlayClick={blocking}
      shouldFocusAfterRender={focusOnRender}
      ariaHideApp={blocking}
      preventScroll={blocking}
      onRequestClose={() => onBeforeClose()}
      portalClassName={"bottom-sheet-presenter-portal"}
      onAfterOpen={() => {
        setTimeout(() => requestSheetUp());
      }}
      overlayElement={(overlayElementProps, contentEl) => {
        return (
          <EmotionThemeProvider
            {...overlayElementProps}
            scope="sheet"
            style={{
              ...overlayElementProps.style,
              position: blocking ? "fixed" : "sticky",
              zIndex: 1000,
              backgroundColor: !blocking ? "transparent" : "unset"
            }}
            tabIndex={-1}
          >
            {blocking && (
              <div
                ref={overlayRef}
                style={{
                  height: "100%",
                  width: "100%",
                  zIndex: 1000,
                  transition: "opacity 0.3s ease-out",
                  position: "absolute",
                  backgroundColor: "var(--backdrop)"
                }}
                tabIndex={-1}
              />
            )}
            {contentEl}
          </EmotionThemeProvider>
        );
      }}
      contentElement={(props, children) => (
        <Box
          {...props}
          style={{}}
          sx={{
            // top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: "flex",
            width: "auto",
            height: "fit-content",
            position: "fixed",
            backgroundColor: undefined,
            padding: 0,
            zIndex: 1001,
            outline: 0,
            isolation: "isolate",
            userSelect: "none"
          }}
        >
          {children}
        </Box>
      )}
    >
      <Flex
        ref={sheetRef}
        sx={{
          bg: "background",
          transform: "translate3d(0, 101%, 0)",
          transition: sheetTransition,
          borderTopLeftRadius: 15,
          borderTopRightRadius: 15,
          boxShadow: theme?.shadows.menu || "none",
          flex: 1,
          flexDirection: "column"
        }}
      >
        {draggable && (
          <Flex
            onMouseDown={onMouseStart}
            onMouseMove={onMouseMove}
            onMouseUp={onSwipeEnd}
            onTouchStart={onSwipeStart}
            onTouchMove={onSwipeMove}
            onTouchEnd={onSwipeEnd}
            sx={{
              bg: "transparent",
              alignItems: "center",
              justifyContent: "center",
              p: 2
            }}
          >
            <Box
              id="pill"
              sx={{
                bg: "background-secondary",
                width: 100,
                height: 6,
                borderRadius: 100
              }}
            />
          </Flex>
        )}
        <ContentContainer items={items} title={title} onClose={onClose}>
          {children}
        </ContentContainer>
      </Flex>
    </Modal>
  );
}

type ContentContainerProps = {
  title?: string;
  items?: MenuItem[];
  onClose?: () => void;
};
function ContentContainer(props: PropsWithChildren<ContentContainerProps>) {
  const { title, items, onClose, children } = props;

  const { current, goBack, canGoBack, navigate } =
    useHistory<ActionSheetHistoryItem>({
      title,
      items
    });

  return (
    <Flex sx={{ flexDirection: "column" }}>
      {canGoBack || current?.title ? (
        <Flex id="header" sx={{ alignItems: "center", mx: 0, mb: 1 }}>
          {canGoBack && (
            <Button variant={"icon"} sx={{ p: 1, ml: 1 }} onClick={goBack}>
              <Icon path={Icons.arrowLeft} size={"big"} />
            </Button>
          )}
          {current?.title && (
            <Text variant={"title"} sx={{ ml: 1, fontSize: "title" }}>
              {current?.title}
            </Text>
          )}
        </Flex>
      ) : null}
      {children
        ? children
        : current?.items?.map((item) => {
            if (item.isHidden) return null;

            switch (item.type) {
              case "separator":
                return <MenuSeparator key={item.key} />;
              case "button":
                return (
                  <MenuButton
                    key={item.key}
                    item={item}
                    onClick={() => {
                      if (item.menu) {
                        navigate(item.menu);
                      } else if (item.onClick) {
                        onClose?.();
                        setTimeout(() => {
                          item.onClick?.();
                        }, 300);
                      }
                    }}
                  />
                );
              case "popup":
                return (
                  <React.Fragment key={item.key}>
                    <item.component onClick={onClose} />
                  </React.Fragment>
                );
            }
          })}
    </Flex>
  );
}
