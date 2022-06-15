import React, { PropsWithChildren, useCallback, useRef, useState } from "react";
import { MenuItem } from "../menu/types";
import { useTheme } from "emotion-theming";
import Sheet from "react-modal-sheet";
import { Theme } from "@notesnook/theme";
import { Button, Flex, Text } from "rebass";
import { Icon } from "../../toolbar/components/icon";
import { Icons } from "../../toolbar/icons";
import { MenuButton } from "../menu/menu-button";
import { MenuSeparator } from "../menu/menu-separator";

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
    children,
  } = props;
  const theme: Theme = useTheme();
  const contentRef = useRef<HTMLDivElement>();
  const focusedElement = useRef<HTMLElement>();

  // hijack the back button temporarily for a more native experience
  // on mobile phones.
  const onPopState = useCallback(
    (e: PopStateEvent | BeforeUnloadEvent) => {
      if (onClose) {
        onClose();
        e.preventDefault();
        return true;
      }
    },
    [isOpen, onClose]
  );

  return (
    <Sheet
      isOpen={isOpen}
      onClose={onClose || (() => {})}
      springConfig={{
        stiffness: 300,
        damping: 30,
        mass: 0.2,
        duration: 300,
      }}
      onOpenStart={() => {
        window.addEventListener("popstate", onPopState);
        window.addEventListener("beforeunload", onPopState);

        if (focusOnRender) {
          focusedElement.current =
            (document.activeElement as HTMLElement) || undefined;
          contentRef.current?.focus({ preventScroll: true });
        }
      }}
      onCloseEnd={() => {
        window.removeEventListener("popstate", onPopState);
        window.removeEventListener("beforeunload", onPopState);
        if (focusOnRender) {
          focusedElement.current?.focus({ preventScroll: true });
        }
      }}
    >
      <Sheet.Container
        style={{
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          boxShadow: theme.shadows.menu,
        }}
      >
        <Sheet.Header disableDrag={!onClose} />
        <Sheet.Content>
          <div
            id="action-sheet-focus"
            ref={(ref) => (contentRef.current = ref || undefined)}
            tabIndex={-1}
          />
          <ContentContainer items={items} title={title} onClose={onClose}>
            {children}
          </ContentContainer>
        </Sheet.Content>
      </Sheet.Container>

      {blocking ? (
        <Sheet.Backdrop style={{ border: "none" }} onTap={onClose} />
      ) : (
        <></>
      )}
    </Sheet>
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
      <Flex id="header" sx={{ alignItems: "center", mx: 2, mb: 2 }}>
        {canGoBack && (
          <Button variant={"icon"} sx={{ p: 1, mr: 2 }} onClick={goBack}>
            <Icon path={Icons.chevronLeft} size={"big"} />
          </Button>
        )}
        {current?.title && (
          <Text variant={"title"} sx={{ ml: 1, fontSize: "title" }}>
            {current?.title}
          </Text>
        )}
      </Flex>
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
                        item.onClick();
                        onClose?.();
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
