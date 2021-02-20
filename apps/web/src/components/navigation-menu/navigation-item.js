import React from "react";
import { Flex, Button, Text } from "rebass";
import { useStore as useAppStore } from "../../stores/app-store";
import { useOpenContextMenu } from "../../utils/useContextMenu";
import useMobile from "../../utils/use-mobile";
import * as Icons from "../icons";

function NavigationItem(props) {
  const { icon: Icon, color, title, isLoading, isShortcut } = props;
  const toggleSideMenu = useAppStore((store) => store.toggleSideMenu);
  const isMobile = useMobile();
  const openContextMenu = useOpenContextMenu();

  return (
    <Button
      data-test-id={`navitem-${title.toLowerCase()}`}
      variant="icon"
      py={2}
      label={title}
      title={title}
      onContextMenu={(event) => {
        if (!props.menu) return;
        openContextMenu(event, props.menu.items, props.menu.extraData, false);
      }}
      onClick={() => {
        if (isMobile) toggleSideMenu(false);
        props.onClick();
      }}
    >
      <Flex
        justifyContent={"flex-start"}
        alignItems="center"
        sx={{ position: "relative" }}
      >
        <Icon
          size={15}
          sx={{ mr: 1 }}
          color={props.selected && !color ? "primary" : color || "icon"}
          rotate={isLoading}
        />
        {isShortcut && (
          <Icons.Shortcut
            size={8}
            sx={{ position: "absolute", bottom: "-3px", left: "-6px" }}
            color={props.selected && !color ? "primary" : color || "icon"}
          />
        )}

        <Text
          variant="body"
          fontSize="subtitle"
          sx={{
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            fontWeight: props.selected ? "bold" : "normal",
          }}
          color={props.selected ? (!!color ? color : "primary") : "text"}
          ml={1}
        >
          {title}
        </Text>
      </Flex>
    </Button>
  );
}
export default NavigationItem;
