import { useRef } from "react";
import { Flex, Text } from "@streetwriters/rebass";
import { Icon } from "../../toolbar/components/icon";
import { Icons } from "../../toolbar/icons";
import { useToolbarLocation } from "../../toolbar/stores/toolbar-store";
import { Button } from "../button";
import { MenuButton, MenuItemComponentProps } from "./types";

type MenuButtonProps = {
  item: MenuButton;
  isFocused?: boolean;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
} & MenuItemComponentProps;

export function MenuButton(props: MenuButtonProps) {
  const { item, isFocused, onMouseEnter, onMouseLeave, onClick } = props;
  const {
    title,
    key,
    icon,
    tooltip,
    isDisabled,
    isChecked,
    menu,
    modifier,
    styles
  } = item;
  const itemRef = useRef<HTMLButtonElement>(null);
  const toolbarLocation = useToolbarLocation();
  const isBottom = toolbarLocation === "bottom";

  return (
    <Flex
      as="li"
      sx={{ flexShrink: 0, flexDirection: "column" }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <Button
        id={key}
        data-test-id={`MenuButton-${key}`}
        key={key}
        ref={itemRef}
        tabIndex={-1}
        variant="menuitem"
        title={tooltip}
        disabled={isDisabled}
        onClick={(e) => onClick?.(e.nativeEvent)}
        sx={{
          ...styles,
          bg: isFocused && !isBottom ? "hover" : "transparent",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          ":hover": {
            bg: isBottom ? "transparent" : "hover"
          }
        }}
      >
        <Flex sx={{ fontSize: "inherit", fontFamily: "inherit" }}>
          {icon && (
            <Icon
              path={Icons[icon]}
              color={"text"}
              size={"medium"}
              sx={{ mr: 2 }}
            />
          )}
          <Text
            as="span"
            variant={"body"}
            sx={{ fontSize: "inherit", fontFamily: "inherit" }}
          >
            {title}
          </Text>
        </Flex>
        {isChecked || menu || modifier ? (
          <Flex sx={{ ml: 4 }}>
            {isChecked && <Icon path={Icons.check} size={"small"} />}
            {menu && <Icon path={Icons.chevronRight} size={"small"} />}
            {modifier && (
              <Text
                as="span"
                sx={{
                  fontFamily: "body",
                  fontSize: "menu",
                  color: "fontTertiary"
                }}
              >
                {modifier}
              </Text>
            )}
          </Flex>
        ) : null}
      </Button>
    </Flex>
  );
}
