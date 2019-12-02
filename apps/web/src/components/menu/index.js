import React from "react";
import { Flex, Box, Text } from "rebass";
import { SHADOW } from "../../theme";

function Menu(props) {
  return (
    <Flex
      bg="primary"
      py={1}
      sx={{ borderRadius: "default", boxShadow: SHADOW }}
    >
      <Box>
        {props.menuItems.map(item => (
          <Flex
            key={item.title}
            onClick={() => {
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
                backgroundColor: "accent",
                color: "fontSecondary"
              }
            }}
          >
            <item.icon size={15} strokeWidth={1.5} />
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
