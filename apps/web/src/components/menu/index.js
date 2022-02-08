import React, { useCallback, useEffect, useState } from "react";
import { Flex, Text } from "rebass";
import MenuItem from "./menu-item";

function useMenuFocus(items) {
  const [focusIndex, setFocusIndex] = useState(-1);
  const [isSubmenuOpen, setIsSubmenuOpen] = useState(false);

  const onKeyDown = useCallback(
    (e) => {
      const isSeperator = (i) => items && items[i]?.type === "seperator";
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
            if (isSeperator(nextIndex)) nextIndex = moveUp(nextIndex);
            break;
          case "ArrowDown":
            if (isSubmenuOpen) break;
            nextIndex = moveDown(i);
            if (isSeperator(nextIndex)) nextIndex = moveDown(nextIndex);
            break;
          case "ArrowRight":
            openSubmenu(i);
            break;
          case "ArrowLeft":
            closeSubmenu(i);
            break;
          default:
            break;
        }

        return nextIndex;
      });
    },
    [items, isSubmenuOpen]
  );

  useEffect(() => {
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [onKeyDown]);

  return [focusIndex, setFocusIndex, isSubmenuOpen, setIsSubmenuOpen];
}

function Menu({ items, data, closeMenu }) {
  const [focusIndex, setFocusIndex, isSubmenuOpen, setIsSubmenuOpen] =
    useMenuFocus(items);

  return (
    <MenuContainer title={data?.title}>
      {items.map((item, index) => (
        <MenuItem
          key={item.key}
          index={index}
          item={item}
          data={data}
          onClose={closeMenu}
          isFocused={focusIndex === index}
          isSubmenuOpen={focusIndex === index && isSubmenuOpen}
          onHover={() => {
            setFocusIndex(index);
            setIsSubmenuOpen((state) => {
              return item.items?.length ? true : state ? false : state;
            });
          }}
        />
      ))}
    </MenuContainer>
  );
}
export default React.memo(Menu);

function MenuContainer({ title, children }) {
  return (
    <Flex
      as="ul"
      tabIndex={-1}
      bg="background"
      py={1}
      flexDirection={"column"}
      sx={{
        position: "relative",
        listStyle: "none",
        padding: 0,
        margin: 0,
        borderRadius: "default",
        boxShadow: "0px 0px 10px 0px #00000022",
        border: "1px solid var(--border)",
        width: 220,
      }}
    >
      {title && (
        <Text
          fontFamily="body"
          fontSize="subtitle"
          color="primary"
          py={"8px"}
          px={3}
          sx={{ borderBottom: "1px solid", borderBottomColor: "border" }}
        >
          {title}
        </Text>
      )}
      {children}
    </Flex>
  );
}
