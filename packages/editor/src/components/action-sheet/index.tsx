import React, { PropsWithChildren, useCallback, useRef, useState } from "react";
import { MenuItem } from "../menu/types";
import { useTheme } from "emotion-theming";
import { Theme } from "@notesnook/theme";
import { Box, Button, Flex, Text } from "rebass";
import { Icon } from "../../toolbar/components/icon";
import { Icons } from "../../toolbar/icons";
import { MenuButton } from "../menu/menu-button";
import { MenuSeparator } from "../menu/menu-separator";
import Modal from "react-modal";
import {
  motion,
  PanInfo,
  useMotionValue,
  animate,
  useTransform,
  useAnimation,
} from "framer-motion";

const AnimatedFlex = motion(Flex);
type ActionSheetHistoryItem = {
  title?: string;
  items?: MenuItem[];
};
const TRANSITION = {
  type: "spring",
  stiffness: 300,
  damping: 30,
  mass: 0.2,
  duration: 300,
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
    console.log("NAVI", state);
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
    children,
  } = props;
  const theme: Theme = useTheme();
  const contentRef = useRef<HTMLDivElement>();
  const focusedElement = useRef<HTMLElement>();

  const y = useMotionValue(0);
  const opacity = useTransform(
    y,
    [0, contentRef.current?.offsetHeight || window.innerHeight],
    [1, 0]
  );
  const animation = useAnimation();

  const onBeforeClose = useCallback(() => {
    const height = contentRef.current?.offsetHeight || window.innerHeight;
    setTimeout(() => {
      onClose?.();
    }, TRANSITION.duration - 50);
    animation.start({
      transition: TRANSITION,
      y: height + 100,
    });
  }, [animation, onClose, contentRef.current]);

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
        animation.start({ transition: TRANSITION, y: 0 });
      }}
      overlayElement={(props, contentEl) => {
        return (
          <Box
            {...props}
            //@ts-ignore
            style={{
              ...props.style,
              position: "sticky",
              zIndex: 1000,
              backgroundColor: !blocking ? "transparent" : "unset",
            }}
            tabIndex={-1}
          >
            {blocking && (
              <motion.div
                style={{
                  height: "100%",
                  width: "100%",
                  opacity,
                  position: "absolute",
                  backgroundColor: "var(--overlay)",
                }}
                tabIndex={-1}
              />
            )}
            {contentEl}
          </Box>
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
            zIndex: 0,
            outline: 0,
            isolation: "isolate",
          }}
        >
          {children}
        </Box>
      )}
    >
      <AnimatedFlex
        animate={animation}
        style={{ y }}
        initial={{ y: 1000 }}
        sx={{
          bg: "background",
          borderTopLeftRadius: 15,
          borderTopRightRadius: 15,
          boxShadow: theme.shadows.menu,
          flex: 1,
          flexDirection: "column",
        }}
      >
        {draggable && (
          <AnimatedFlex
            drag="y"
            // @ts-ignore
            onDrag={(_, { delta }: PanInfo) => {
              y.set(Math.max(y.get() + delta.y, 0));
            }}
            // @ts-ignore
            onDragEnd={(_, { velocity }: PanInfo) => {
              if (velocity.y >= 500) {
                onClose?.();
                return;
              }
              const sheetEl = contentRef.current as HTMLDivElement;
              const contentHeight = sheetEl.offsetHeight;
              const threshold = 30;
              const closingHeight = (contentHeight * threshold) / 100;

              if (y.get() >= closingHeight) {
                onBeforeClose();
              } else {
                animation.start({ transition: TRANSITION, y: 0 });
              }
            }}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragMomentum={false}
            dragElastic={false}
            sx={{
              bg: "transparent",
              alignItems: "center",
              justifyContent: "center",
              p: 2,
            }}
          >
            <Box
              id="pill"
              sx={{
                backgroundColor: "hover",
                width: 60,
                height: 8,
                borderRadius: 100,
              }}
            />
          </AnimatedFlex>
        )}
        <ContentContainer items={items} title={title} onClose={onClose}>
          {children}
        </ContentContainer>
      </AnimatedFlex>
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
      items,
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
            switch (item.type) {
              case "separator":
                return <MenuSeparator key={item.key} />;
              case "button":
                return (
                  <MenuButton
                    key={item.key}
                    item={item}
                    onClick={(e) => {
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
