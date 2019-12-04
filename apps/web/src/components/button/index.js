import React from "react";
import { Flex, Text } from "rebass";
import { ButtonPressedStyle } from "../../theme";

const Button = props => (
  <Flex
    bg="accent"
    width={props.width || "full"}
    py={3}
    px={3}
    flexDirection="row"
    alignItems="center"
    sx={{
      borderRadius: "default",
      marginBottom: 2,
      color: "fontSecondary",
      fontFamily: "body",
      fontWeight: "body",
      boxShadow: "0 0 20px 0px #1790F3aa",
      ...ButtonPressedStyle,
      ...props.style
    }}
    onClick={props.onClick}
  >
    {props.Icon && <props.Icon />}
    <Text as="span" className="unselectable" mx={1} flex="1 1 auto">
      {props.content}
    </Text>
  </Flex>
);

export default Button;
