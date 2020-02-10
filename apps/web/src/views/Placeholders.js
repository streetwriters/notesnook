import React from "react";
import { Flex, Box } from "rebass";
import "./Placeholders.css";

var parameters = {
  padding: "3.5px",
  margin: "2.5px",
  width: "180px",
  shadow: "primary",
  opacity: "0.5"
};

const HomeAnim = props => {
  return (
    <Flex
      marginBottom={props.marginB}
      marginRight={props.marginR}
      className="home-animation"
      flexDirection="row"
      bg="accent"
      opacity="0.9"
      sx={{ boxShadow: "0.1px 0.1px 4px 2px #000", borderRadius: "5px" }}
    >
      <Flex>
        <Box
          width={1}
          bg="primary"
          sx={{ borderRadius: "25px" }}
          px={parameters.padding}
          height="100%"
        ></Box>
      </Flex>
      <Flex flexDirection="column" px="5px" py="5px">
        <Box color="primary">Title</Box>
        <Box
          opacity={parameters.opacity}
          bg={parameters.shadow}
          sx={{ borderRadius: "25px" }}
          py={parameters.padding}
          my={parameters.margin}
          width={parameters.width}
        ></Box>
        <Box
          opacity={parameters.opacity}
          bg={parameters.shadow}
          sx={{ borderRadius: "25px" }}
          py={parameters.padding}
          my={parameters.margin}
        ></Box>
        <Box
          opacity={parameters.opacity}
          bg={parameters.shadow}
          sx={{ borderRadius: "25px" }}
          py={parameters.padding}
          my={parameters.margin}
        ></Box>
        <Box
          opacity={parameters.opacity}
          bg={parameters.shadow}
          sx={{ borderRadius: "25px" }}
          py={parameters.padding}
          my={parameters.margin}
        ></Box>
        <Box
          opacity={parameters.opacity}
          bg={parameters.shadow}
          sx={{ borderRadius: "25px" }}
          py={parameters.padding}
          my={parameters.margin}
        ></Box>
        <Flex flexDirection="row">
          <Box
            width={1 / 6}
            py={parameters.padding}
            my={parameters.margin}
            sx={{ borderRadius: "25px" }}
            bg="gray"
          ></Box>
          <Box
            width={1 / 6}
            height={1}
            py={parameters.padding}
            my={parameters.margin}
            mx="10px"
            sx={{ borderRadius: "25px" }}
            bg="gray"
          ></Box>
        </Flex>
      </Flex>
    </Flex>
  );
};

export { HomeAnim };
