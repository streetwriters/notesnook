import React from "react";
import * as Icon from "react-feather";
import { Flex, Box, Text } from "rebass";
import { Input } from "@rebass/forms";
import CheckBox from "../components/checkbox";

function Properties() {
  return (
    <Flex
      sx={{ borderLeft: "1px solid", borderColor: "border" }}
      flexDirection="column"
      bg="shade"
      flex="1 1 auto"
      px={2}
      py={2}
      width={["0%", "0%", "10%"]}
    >
      <Text variant="title" color="primary" my={2}>
        Properties
      </Text>
      <CheckBox icon={Icon.MapPin} label="Pin" />
      <CheckBox icon={Icon.Star} label="Favorite" />
      <CheckBox icon={Icon.Lock} label="Lock" />
      <Flex fontSize="body" sx={{ marginBottom: 2 }} alignItems="center">
        <Icon.Tag size={18} />
        <Text sx={{ marginLeft: 1 }}>Tags:</Text>
      </Flex>
      <Input sx={{ marginBottom: 2 }} variant="default" />
      <Flex fontSize="body" sx={{ marginBottom: 2 }} alignItems="center">
        <Icon.Octagon size={18} />
        <Text sx={{ marginLeft: 1 }}>Colors:</Text>
      </Flex>
      <Flex flexWrap="wrap" sx={{ marginBottom: 2 }}>
        {[
          { label: "red", code: "#ed2d37" },
          { label: "orange", code: "#ec6e05" },
          { label: "yellow", code: "yellow" },
          { label: "green", code: "green" },
          { label: "blue", code: "blue" },
          { label: "purple", code: "purple" },
          { label: "gray", code: "gray" }
        ].map(color => (
          <Box sx={{ cursor: "pointer" }}>
            <Icon.Circle size={40} fill={color.code} strokeWidth={0} />
          </Box>
        ))}
      </Flex>
    </Flex>
  );
}

export default Properties;
