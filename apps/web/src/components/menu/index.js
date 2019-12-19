import React from "react";
import { Flex, Box, Text } from "rebass";
import { SHADOW } from "../../theme";

function Menu(props) {
  return (
    <Flex
      bg="navbg"
      py={1}
      sx={{
        position: "relative",
        borderRadius: "default",
        boxShadow: 2,
        width: 120
      }}
    >
      <Box width="100%" bg="navbg">
        {props.menuItems.map(item => (
          <Flex
            key={item.title}
            onClick={e => {
              if (props.dropdownRef) {
                props.dropdownRef.hide();
              }
              if (item.onClick) {
                item.onClick(props.data);
              }
              e.stopPropagation();
            }}
            flexDirection="row"
            alignItems="center"
            py={1}
            px={2}
            sx={{
              color: item.color || "fontPrimary",
              ":hover": {
                backgroundColor: "primary",
                color: "fontSecondary"
              }
            }}
          >
            <Text
              className="unselectable"
              as="span"
              mx={1}
              fontFamily="body"
              fontSize="menu"
            >
              {item.title}
            </Text>
          </Flex>
        ))}
      </Box>
    </Flex>
  );
}
export default Menu;
