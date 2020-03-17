import React from "react";
import { Flex, Box, Text } from "rebass";
import Dropdown from "../dropdown";

function Menu(props) {
  return (
    <Flex
      id={props.id}
      bg="background"
      py={1}
      style={props.style}
      sx={{
        position: "relative",
        borderRadius: "default",
        boxShadow: 2,
        width: 140,
        ...props.sx
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
          item =>
            !item.invisible && (
              <Flex
                key={item.title}
                onClick={e => {
                  e.stopPropagation();
                  Dropdown.closeLastOpened();
                  if (props.closeMenu) {
                    props.closeMenu();
                  }
                  if (item.onClick) {
                    item.onClick(props.data);
                  }
                }}
                flexDirection="row"
                alignItems="center"
                py={"8px"}
                px={3}
                sx={{
                  color: item.color || "fontPrimary",
                  ":hover": {
                    backgroundColor: "shade"
                  }
                }}
              >
                <Text as="span" fontFamily="body" fontSize="menu">
                  {item.title}
                </Text>
              </Flex>
            )
        )}
      </Box>
    </Flex>
  );
}
export default Menu;
