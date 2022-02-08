import { Check, ChevronRight, Pro } from "../icons";
import React, { useCallback, useEffect, useRef } from "react";
import { Flex, Box, Text, Button } from "rebass";
import { getPosition } from "../../hooks/use-menu";
import Menu from "./index";

function MenuItem({ item, data, isFocused, isSubmenuOpen, onClose, onHover }) {
  const {
    title,
    key,
    onClick,
    color,
    items,
    icon: Icon,
    iconColor,
    type,
    tooltip,
    isDisabled,
    isChecked,
    hasSubmenu,
    isPremium,
  } = item;
  const itemRef = useRef();
  const subMenuRef = useRef();

  useEffect(() => {
    if (isFocused) itemRef.current?.focus();
  }, [isFocused]);

  useEffect(() => {
    if (!subMenuRef.current) return;
    if (!isSubmenuOpen) {
      subMenuRef.current.style.visibility = "hidden";
      return;
    }

    const { top, left } = getPosition(
      subMenuRef.current,
      itemRef.current,
      "right"
    );

    subMenuRef.current.style.visibility = "visible";
    subMenuRef.current.style.top = `${top}px`;
    subMenuRef.current.style.left = `${left}px`;
  }, [isSubmenuOpen]);

  const onAction = useCallback(
    (e) => {
      e.stopPropagation();
      if (onClose) onClose();
      if (onClick) onClick(data, item);
    },
    [onClick, onClose, item, data]
  );

  if (type === "seperator")
    return (
      <Box
        as="li"
        key={key}
        width="95%"
        height="0.5px"
        bg="border"
        my={2}
        alignSelf="center"
      />
    );

  return (
    <Flex
      as="li"
      flexDirection={"column"}
      flex={1}
      // sx={{ position: "relative" }}
      onMouseOver={onHover}
    >
      <Button
        data-test-id={`menuitem-${title.split(" ").join("").toLowerCase()}`}
        key={key}
        ref={itemRef}
        tabIndex={-1}
        variant="menuitem"
        display="flex"
        alignItems={"center"}
        justifyContent={"space-between"}
        title={tooltip}
        disabled={isDisabled}
        onClick={onAction}
        onKeyUp={(e) => {
          if (e.key === "Enter") onAction(e);
        }}
        sx={{
          bg: isFocused ? "hover" : "transparent",
        }}
      >
        <Flex>
          {Icon && (
            <Icon color={iconColor || "text"} size={15} sx={{ mr: 2 }} />
          )}
          <Text
            as="span"
            fontFamily="body"
            fontSize="menu"
            color={color || "text"}
          >
            {title}
          </Text>
          {isPremium && <Pro size={14} color="primary" sx={{ ml: 1 }} />}
        </Flex>
        <Flex>
          {isChecked && <Check size={14} />}
          {hasSubmenu && <ChevronRight size={14} />}
        </Flex>
      </Button>
      {hasSubmenu && (
        <Flex
          ref={subMenuRef}
          style={{ visibility: "hidden" }}
          sx={{
            position: "absolute",
            // top: 0,
            // left: itemRef.current?.offsetWidth,
          }}
        >
          <Menu
            items={items}
            onClose={onClose}
            data={{ ...data, parent: item, title: undefined }}
          />
        </Flex>
      )}
    </Flex>
  );
}
export default MenuItem;
