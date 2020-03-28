import React, { useState, useEffect } from "react";
import { Flex, Button, Text } from "rebass";
import { useStore as useUserStore } from "../../stores/user-store";

function NavItem(props) {
  const { key, animatable, icon: Icon, color, title } = props.item;
  const [isLoading, setIsLoading] = useState(false);
  const isSyncing = useUserStore(store => store.isSyncing);

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
        ml={[2, 0, 0]}
      >
        <Icon
          size={18}
          color={props.selected ? "primary" : color || "icon"}
          rotate={isLoading}
        />
        <Text variant="body" display={["flex", "none", "none"]} ml={1}>
          {title}
        </Text>
        {/* {count && (
          <Text sx={{ position: "absolute", top: -8, right: 10 }} fontSize={9}>
            {count > 99 ? "99+" : count}
          </Text>
        )} */}
      </Flex>
    </Button>
  );
}
export default NavItem;
