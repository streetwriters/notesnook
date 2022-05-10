import React, {
  useCallback,
  useRef,
  useEffect,
  useState,
  PropsWithChildren,
} from "react";
import ReactDOM from "react-dom";
import { Box, Flex, FlexProps, Text } from "rebass";
import { getPosition, MenuOptions } from "./useMenu";
// import { FlexScrollContainer } from "../scrollcontainer";
import MenuItem from "./menuitem";
import { MenuItem as MenuItemType /*ResolvedMenuItem*/ } from "./types";
// import { useMenuTrigger, useMenu, getPosition } from "../../hooks/useMenu";
import Modal from "react-modal";
import { ThemeProvider } from "emotion-theming";
// import { store as selectionStore } from "../../stores/selectionstore";

function useMenuFocus(
  items: MenuItemType[],
  onAction: (event: KeyboardEvent) => void,
  onClose: (event: KeyboardEvent) => void
) {
  const [focusIndex, setFocusIndex] = useState(-1);
  const [isSubmenuOpen, setIsSubmenuOpen] = useState(false);

  const moveItemIntoView = useCallback(
    (index) => {
      const item = items[index];
      if (!item) return;
      const element = document.getElementById(item.key);
      if (!element) return;
      element.scrollIntoView({
        behavior: "auto",
      });
    },
    [items]
  );

  const onKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const isSeperator = (i: number) =>
        items && (items[i]?.type === "seperator" || items[i]?.isDisabled);
      const moveDown = (i: number) => (i < items.length - 1 ? ++i : 0);
      const moveUp = (i: number) => (i > 0 ? --i : items.length - 1);
      const hasSubmenu = (i: number) => items && items[i]?.hasSubmenu;
      const openSubmenu = (index: number) => {
        if (!hasSubmenu(index)) return;
        setIsSubmenuOpen(true);
      };

      const closeSubmenu = (index: number) => {
        if (!hasSubmenu(index)) return;
        setIsSubmenuOpen(false);
      };

      setFocusIndex((i) => {
        let nextIndex = i;

        switch (e.key) {
          case "ArrowUp":
            if (isSubmenuOpen) break;
            nextIndex = moveUp(i);
            while (isSeperator(nextIndex)) {
              nextIndex = moveUp(nextIndex);
            }
            break;
          case "ArrowDown":
            if (isSubmenuOpen) break;
            nextIndex = moveDown(i);
            while (isSeperator(nextIndex)) {
              nextIndex = moveDown(nextIndex);
            }
            break;
          case "ArrowRight":
            openSubmenu(i);
            break;
          case "ArrowLeft":
            closeSubmenu(i);
            break;
          case "Enter":
            onAction && onAction(e);
            break;
          case "Escape":
            onClose && onClose(e);
            break;
          default:
            break;
        }
        if (nextIndex !== i) moveItemIntoView(nextIndex);

        return nextIndex;
      });
    },
    [items, isSubmenuOpen, moveItemIntoView, onAction]
  );

  useEffect(() => {
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [onKeyDown]);

  return { focusIndex, setFocusIndex, isSubmenuOpen, setIsSubmenuOpen };
}

type MenuProps = MenuContainerProps & {
  items: MenuItemType[];
  closeMenu: () => void;
};

export function Menu(props: MenuProps) {
  const { items, title, closeMenu, ...containerProps } = props;
  const hoverTimeout = useRef<NodeJS.Timeout>();
  const onAction = useCallback(
    (e, item) => {
      e?.stopPropagation();
      if (closeMenu) closeMenu();
      if (item.onClick) {
        item.onClick();
      }
    },
    [closeMenu]
  );

  const { focusIndex, setFocusIndex, isSubmenuOpen, setIsSubmenuOpen } =
    useMenuFocus(
      items,
      (e) => {
        const item = items[focusIndex];
        if (item) onAction(e, item);
      },
      () => closeMenu()
    );

  const subMenuRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const item = items[focusIndex];
    if (!item || !subMenuRef.current) return;

    const menuItemElement = document.getElementById(item.key);
    if (!menuItemElement) return;

    if (!isSubmenuOpen) {
      subMenuRef.current.style.visibility = "hidden";
      return;
    }

    const { top, left } = getPosition(subMenuRef.current, {
      // yOffset: menuItemElement.offsetHeight,
      target: menuItemElement,
      location: "right",
    });

    subMenuRef.current.style.visibility = "visible";
    subMenuRef.current.style.top = `${top}px`;
    subMenuRef.current.style.left = `${left}px`;
  }, [isSubmenuOpen, focusIndex, items]);

  return (
    <>
      <MenuContainer {...containerProps}>
        {items.map((item, index) => (
          <MenuItem
            key={item.key}
            item={item}
            onClick={(e) => {
              if (item.items?.length) {
                setFocusIndex(index);
                setIsSubmenuOpen(true);
              } else onAction(e, item);
            }}
            isFocused={focusIndex === index}
            onMouseEnter={() => {
              if (item.isDisabled) {
                setFocusIndex(-1);
                return;
              }

              if (hoverTimeout.current) clearTimeout(hoverTimeout.current);
              setFocusIndex(index);
              setIsSubmenuOpen(false);
              if (item.items?.length) {
                hoverTimeout.current = setTimeout(() => {
                  setIsSubmenuOpen(true);
                }, 500);
              }
            }}
            onMouseLeave={() => {
              if (hoverTimeout.current) clearTimeout(hoverTimeout.current);
            }}
          />
        ))}
      </MenuContainer>
      {isSubmenuOpen && (
        <Flex
          ref={subMenuRef}
          style={{ visibility: "hidden" }}
          sx={{
            position: "absolute",
          }}
        >
          <Menu items={items[focusIndex]?.items || []} closeMenu={closeMenu} />
        </Flex>
      )}
    </>
  );
}

type MenuContainerProps = FlexProps & {
  title?: string;
};
function MenuContainer(props: PropsWithChildren<MenuContainerProps>) {
  const { children, title, sx, ...flexProps } = props;

  return (
    <Box
      className="menuContainer"
      as="ul"
      tabIndex={-1}
      sx={{
        bg: "background",
        py: 1,
        display: "flex",
        flexDirection: "column",
        position: "relative",
        listStyle: "none",
        padding: 0,
        margin: 0,
        borderRadius: "default",
        boxShadow: "menu",
        border: "1px solid var(--border)",
        minWidth: 220,
        ...sx,
      }}
      {...flexProps}
    >
      {title && (
        <Text
          sx={{
            fontFamily: "body",
            fontSize: "subtitle",
            color: "primary",
            py: "8px",
            px: 3,
            borderBottom: "1px solid",
            borderBottomColor: "border",
            wordWrap: "break-word",
          }}
        >
          {title}
        </Text>
      )}
      {children}
      {/* <FlexScrollContainer>{children}</FlexScrollContainer> */}
    </Box>
  );
}

export type MenuPresenterProps = MenuContainerProps & {
  items: MenuItemType[];
  options: MenuOptions;
  isOpen: boolean;
  onClose: () => void;
  className?: string;
};
export function MenuPresenter(props: PropsWithChildren<MenuPresenterProps>) {
  const {
    className,
    options,
    items,
    isOpen,
    onClose,
    children,
    ...containerProps
  } = props;
  // const { isOpen, closeMenu } = useMenuTrigger();
  //  const { items, } = useMenu();
  const { position, type } = options;
  const isAutocomplete = type === "autocomplete";
  const contentRef = useRef<HTMLDivElement>();

  useEffect(() => {
    if (!contentRef.current || !position) return;
    const menu = contentRef.current;
    const menuPosition = getPosition(menu, position);
    menu.style.top = menuPosition.top + "px";
    menu.style.left = menuPosition.left + "px";
  }, [position]);

  return (
    <Modal
      contentRef={(ref) => (contentRef.current = ref)}
      className={className || "menuContainer"}
      role="menu"
      isOpen={isOpen}
      appElement={document.body}
      shouldCloseOnEsc
      shouldReturnFocusAfterClose
      shouldCloseOnOverlayClick
      shouldFocusAfterRender={!isAutocomplete}
      ariaHideApp={!isAutocomplete}
      preventScroll={!isAutocomplete}
      onRequestClose={onClose}
      portalClassName={className || "menuPresenter"}
      onAfterOpen={(obj) => {
        if (!obj || !position) return;
        const { contentEl: menu } = obj;
        const menuPosition = getPosition(menu, position);
        menu.style.top = menuPosition.top + "px";
        menu.style.left = menuPosition.left + "px";
      }}
      overlayElement={(props, contentEl) => {
        return (
          <Box
            {...props}
            style={{
              ...props.style,
              position: isAutocomplete ? "initial" : "fixed",
              zIndex: 1000,
              backgroundColor: isAutocomplete ? "transparent" : "unset",
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
          sx={{
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: "flex",
            width: "fit-content",
            height: "fit-content",
            position: "absolute",
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
      style={{
        content: {},
        overlay: {
          zIndex: 999,
          background: "transparent",
        },
      }}
    >
      {props.children ? (
        props.children
      ) : (
        <Menu items={items} closeMenu={onClose} {...containerProps} />
      )}
    </Modal>
  );
}
