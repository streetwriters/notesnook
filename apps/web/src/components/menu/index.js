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

import React, { useCallback, useRef, useEffect, useState } from "react";
import { Flex, Text } from "@theme-ui/components";
import { getPosition } from "../../hooks/use-menu";
import { FlexScrollContainer } from "../scroll-container";
import MenuItem from "./menu-item";
import { store as selectionStore } from "../../stores/selection-store";

function useMenuFocus(items, onAction, onClose) {
  const [focusIndex, setFocusIndex] = useState(-1);
  const [isSubmenuOpen, setIsSubmenuOpen] = useState(false);

  const moveItemIntoView = useCallback(
    (index) => {
      const item = items[index];
      if (!item) return;
      const element = document.getElementById(item.key);
      if (!element) return;
      element.scrollIntoView({
        behavior: "auto"
      });
    },
    [items]
  );

  const onKeyDown = useCallback(
    (e) => {
      const isSeperator = (i) =>
        items && (items[i]?.type === "seperator" || items[i]?.isDisabled);
      const moveDown = (i) => (i < items.length - 1 ? ++i : 0);
      const moveUp = (i) => (i > 0 ? --i : items.length - 1);
      const hasSubmenu = (i) => items && items[i]?.hasSubmenu;
      const openSubmenu = (index) => {
        if (!hasSubmenu(index)) return;
        setIsSubmenuOpen(true);
      };

      const closeSubmenu = (index) => {
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
    [items, isSubmenuOpen, moveItemIntoView, onAction, onClose]
  );

  useEffect(() => {
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [onKeyDown]);

  return [focusIndex, setFocusIndex, isSubmenuOpen, setIsSubmenuOpen];
}

function Menu({ items, data, title, closeMenu }) {
  const hoverTimeout = useRef();
  const onAction = useCallback(
    (e, item) => {
      e.stopPropagation();
      if (closeMenu) closeMenu();
      if (item.onClick) {
        item.onClick();
        // TODO: this probably shouldn't be here.
        selectionStore.toggleSelectionMode(false);
      }
    },
    [closeMenu]
  );

  const [focusIndex, setFocusIndex, isSubmenuOpen, setIsSubmenuOpen] =
    useMenuFocus(
      items,
      (e) => {
        const item = items[focusIndex];
        if (item) onAction(e, item);
      },
      () => closeMenu()
    );

  const subMenuRef = useRef();
  useEffect(() => {
    const item = items[focusIndex];
    if (!item || !subMenuRef.current) return;

    if (!isSubmenuOpen) {
      subMenuRef.current.style.visibility = "hidden";
      return;
    }

    const { top, left } = getPosition(subMenuRef.current, {
      yOffset: document.getElementById(item.key).offsetHeight,
      relativeTo: document.getElementById(item.key),
      location: "right"
    });

    subMenuRef.current.style.visibility = "visible";
    subMenuRef.current.style.top = `${top}px`;
    subMenuRef.current.style.left = `${left}px`;
  }, [isSubmenuOpen, focusIndex, items]);

  return (
    <>
      <MenuContainer title={title}>
        {items.map((item, index) => (
          <MenuItem
            key={item.key}
            index={index}
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

              clearTimeout(hoverTimeout.current);
              setFocusIndex(index);
              setIsSubmenuOpen(false);
              if (item.items?.length) {
                hoverTimeout.current = setTimeout(() => {
                  setIsSubmenuOpen(true);
                }, 500);
              }
            }}
            onMouseLeave={() => {
              clearTimeout(hoverTimeout.current);
            }}
          />
        ))}
      </MenuContainer>
      {isSubmenuOpen && (
        <Flex
          ref={subMenuRef}
          style={{ visibility: "hidden" }}
          sx={{
            position: "absolute"
          }}
        >
          <Menu
            items={items[focusIndex]?.items || []}
            closeMenu={closeMenu}
            data={data}
          />
        </Flex>
      )}
    </>
  );
}
export default React.memo(Menu);

function MenuContainer({ title, children }) {
  return (
    <Flex
      className="menuContainer"
      tabIndex={-1}
      py={1}
      sx={{
        bg: "bgSecondary",
        padding: 0,
        margin: 0,
        borderRadius: "default",
        boxShadow: "0px 0px 10px 0px #00000022",
        border: "1px solid var(--border)",
        width: 220,
        flexDirection: "column"
      }}
    >
      {title && (
        <Text
          py={"8px"}
          px={3}
          sx={{
            borderBottom: "1px solid",
            borderBottomColor: "border",
            wordWrap: "break-word",
            fontSize: "subtitle",
            fontFamily: "body",
            color: "primary"
          }}
          data-test-id="menu-title"
        >
          {title}
        </Text>
      )}
      <FlexScrollContainer>{children}</FlexScrollContainer>
    </Flex>
  );
}
