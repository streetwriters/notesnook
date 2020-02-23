import React from "react";
import { Flex, Box, Text } from "rebass";
import Dropdown from "../dropdown";

function Menu(props) {
  return (
    <Flex
      bg="background"
      py={1}
      sx={{
        position: "relative",
        borderRadius: "default",
        boxShadow: 2,
        width: 120
      }}
    >
      <Box width="100%">
        {props.menuItems.map(item => (
          <Flex
            key={item.title}
            onClick={e => {
              e.stopPropagation();
              Dropdown.closeLastOpened();
              if (props.dropdownRef) {
                props.dropdownRef.hide();
              }
              if (item.onClick) {
                item.onClick(props.data);
              }
            }}
            flexDirection="row"
            alignItems="center"
            py={1}
            px={2}
            sx={{
              color: item.color || "fontPrimary",
              ":hover": {
                backgroundColor: "shade"
              }
            }}
          >
            <Text as="span" mx={1} fontFamily="body" fontSize="menu">
              {item.title}
            </Text>
          </Flex>
        ))}
      </Box>
    </Flex>
  );
}
export default Menu;
