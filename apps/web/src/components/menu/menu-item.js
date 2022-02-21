import { Check, ChevronRight, Pro } from "../icons";
import { useRef } from "react";
import { Flex, Box, Text, Button } from "rebass";

function MenuItem({ item, isFocused, onMouseEnter, onMouseLeave, onClick }) {
  const {
    title,
    key,
    color,
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
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <Button
        id={key}
        data-test-id={`menuitem-${key}`}
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
          {isChecked && (
            <Check size={14} data-test-id={`menuitem-${key}-checked`} />
          )}
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
    </Flex>
  );
}
export default MenuItem;
