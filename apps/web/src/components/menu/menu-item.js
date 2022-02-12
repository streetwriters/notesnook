import { Check, ChevronRight, Pro } from "../icons";
import { useEffect, useRef } from "react";
import { Flex, Box, Text, Button } from "rebass";
import { getPosition } from "../../hooks/use-menu";
import Menu from "./index";

function MenuItem({
  item,
  data,
  isFocused,
  isSubmenuOpen,
  closeMenu,
  onHover,
  onClick,
}) {
  const {
    title,
    key,
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
    modifier,
  } = item;
  const itemRef = useRef();
  const subMenuRef = useRef();

  useEffect(() => {
    if (!subMenuRef.current) return;
    if (!isSubmenuOpen) {
      subMenuRef.current.style.visibility = "hidden";
      return;
    }

    const { top, left } = getPosition(subMenuRef.current, {
      relativeTo: itemRef.current,
      location: "right",
    });

    subMenuRef.current.style.visibility = "visible";
    subMenuRef.current.style.top = `${top}px`;
    subMenuRef.current.style.left = `${left}px`;
  }, [isSubmenuOpen]);

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
        onClick={onClick}
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
          {modifier && (
            <Text
              as="span"
              fontFamily="body"
              fontSize="menu"
              color="fontTertiary"
            >
              {modifier}
            </Text>
          )}
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
          <Menu items={items} closeMenu={closeMenu} data={data} />
        </Flex>
      )}
    </Flex>
  );
}
export default MenuItem;
