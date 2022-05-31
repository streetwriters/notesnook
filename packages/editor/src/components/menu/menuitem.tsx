// import { Check, ChevronRight, Pro } from "../icons";
import { useRef } from "react";
import { Flex, Box, Text, Button } from "rebass";
import { Icon } from "../../toolbar/components/icon";
import { Icons } from "../../toolbar/icons";
import { MenuItem /*ResolvedMenuItem*/ } from "./types";

type MenuItemProps = {
  // item: ResolvedMenuItem;
  item: MenuItem;
  isFocused: boolean;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onClick: (e?: any) => void;
};

function MenuItem(props: MenuItemProps) {
  const { item, isFocused, onMouseEnter, onMouseLeave, onClick } = props;
  const {
    title,
    key,
    // color,
    icon,
    // iconColor,
    type,
    tooltip,
    isDisabled,
    isChecked,
    items,
    component: Component,
    modifier,
  } = item;
  const itemRef = useRef<HTMLButtonElement>(null);

  if (type === "seperator")
    return (
      <Box
        as="li"
        key={key}
        sx={{
          width: "95%",
          height: "0.5px",
          bg: "border",
          my: 2,
          alignSelf: "center",
        }}
      />
    );

  return (
    <Flex
      as="li"
      sx={{ flex: 1, flexDirection: "column" }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {Component ? (
        <Component onClick={onClick} />
      ) : (
        <Button
          id={key}
          data-test-id={`menuitem-${key}`}
          key={key}
          ref={itemRef}
          tabIndex={-1}
          variant="menuitem"
          title={tooltip}
          disabled={isDisabled}
          onClick={onClick}
          sx={{
            bg: isFocused ? "hover" : "transparent",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Flex>
            {icon && (
              <Icon
                path={Icons[icon]}
                color={"text"}
                size={"medium"}
                sx={{ mr: 2 }}
              />
            )}
            <Text as="span" variant={"body"}>
              {title}
            </Text>
          </Flex>
          <Flex>
            {isChecked && <Icon path={Icons.check} size={14} />}
            {items?.length && <Icon path={Icons.chevronRight} size={14} />}
            {modifier && (
              <Text
                as="span"
                sx={{
                  fontFamily: "body",
                  fontSize: "menu",
                  color: "fontTertiary",
                }}
              >
                {modifier}
              </Text>
            )}
          </Flex>
        </Button>
      )}
    </Flex>
  );
}
export default MenuItem;
