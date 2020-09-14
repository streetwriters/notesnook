import React from "react";
import { Flex, Box, Text } from "rebass";
import { useStore as useUserStore } from "../../stores/user-store";

function Menu(props) {
  const isTrial = useUserStore(
    (store) => store.user?.notesnook?.subscription?.isTrial
  );

  return (
    <Flex
      id={props.id}
      bg="background"
      py={1}
      style={props.style}
      sx={{
        position: "relative",
        borderRadius: "default",
        border: "2px solid",
        borderColor: "border",
        width: 180,
        ...props.sx,
      }}
    >
      <Box width="100%">
        <Text
          fontFamily="body"
          fontSize="body"
          color="primary"
          py={"8px"}
          px={3}
          sx={{ borderBottom: "1px solid", borderBottomColor: "border" }}
        >
          Properties
        </Text>
        {props.menuItems.map(
          (item) =>
            item.visible !== false && (
              <Flex
                key={item.title}
                onClick={(e) => {
                  e.stopPropagation();
                  if (props.closeMenu) {
                    props.closeMenu();
                  }
                  console.log("ITEM", item);
                  if (!item.component) {
                    item.onClick(props.data);
                  }
                }}
                flexDirection="row"
                alignItems="center"
                justifyContent="space-between"
                py={"8px"}
                px={3}
                sx={{
                  color: item.color || "text",
                  cursor: "pointer",
                  ":hover": {
                    backgroundColor: "shade",
                  },
                }}
              >
                {item.component ? (
                  <item.component data={props.data} />
                ) : (
                  <Text as="span" fontFamily="body" fontSize="menu">
                    {item.title}
                  </Text>
                )}
                {item.onlyPro && isTrial === undefined && (
                  <Text
                    fontSize="menu"
                    bg="primary"
                    color="static"
                    px={1}
                    sx={{ borderRadius: "default" }}
                  >
                    Pro
                  </Text>
                )}
              </Flex>
            )
        )}
      </Box>
    </Flex>
  );
}
export default Menu;
