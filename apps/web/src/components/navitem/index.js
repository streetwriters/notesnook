import React, { useState, useEffect } from "react";
import { Flex, Button, Text } from "rebass";
import { useStore as useUserStore } from "../../stores/user-store";

function NavItem(props) {
  const { key, animatable, icon: Icon, color, title, count } = props.item;
  const [isLoading, setIsLoading] = useState(false);
  const isSyncing = useUserStore((store) => store.isSyncing);

  useEffect(() => {
    if (animatable) {
      if (key === "sync") setIsLoading(isSyncing);
    }
  }, [isSyncing, setIsLoading, animatable, key]);

  return (
    <Button variant="icon" py={3} title={title} onClick={props.onSelected}>
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
        <Text sx={{ position: "absolute", top: -2, right: 0 }} fontSize={9}>
          {count > 99 ? "99+" : count}
        </Text>
      </Flex>
    </Button>
  );
}
export default NavItem;
