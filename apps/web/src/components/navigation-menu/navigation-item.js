import React from "react";
import { Flex, Button, Text } from "rebass";
import { useStore as useAppStore } from "../../stores/app-store";

function NavigationItem(props) {
  const { icon: Icon, color, title, isLoading } = props;
  const toggleSideMenu = useAppStore((store) => store.toggleSideMenu);

  return (
    <Button
      variant="icon"
      py={3}
      label={title}
      title={title}
      onClick={() => {
        toggleSideMenu(false);
        props.onClick();
      }}
    >
      <Flex
        justifyContent={["flex-start", "center", "center"]}
        alignItems="center"
        ml={[1, 0, 0]}
        sx={{ position: "relative" }}
      >
        <Icon
          size={18}
          sx={{ mr: [1, 0, 0] }}
          color={props.selected ? "primary" : color || "icon"}
          rotate={isLoading}
        />
        <Text
          variant="body"
          display={["flex", "none", "none"]}
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
