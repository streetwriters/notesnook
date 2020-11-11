import React from "react";
import { Flex, Button, Text } from "rebass";
import { useStore as useAppStore } from "../../stores/app-store";
import useMobile from "../../utils/use-mobile";

function NavigationItem(props) {
  const { icon: Icon, color, title, isLoading } = props;
  const toggleSideMenu = useAppStore((store) => store.toggleSideMenu);
  const isMobile = useMobile();

  return (
    <Button
      data-test-id={`navitem-${title.toLowerCase()}`}
      variant="icon"
      py={2}
      label={title}
      title={title}
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
          size={18}
          sx={{ mr: 1 }}
          color={props.selected ? "primary" : color || "icon"}
          rotate={isLoading}
        />
        <Text
          variant="body"
          fontSize="subtitle"
          color={props.selected ? "primary" : "text"}
          ml={1}
        >
          {title}
        </Text>
      </Flex>
    </Button>
  );
}
export default NavigationItem;
