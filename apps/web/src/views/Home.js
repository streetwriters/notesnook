import React, { useEffect } from "react";
import { Flex, Box, Text, Heading } from "rebass";
import * as Icon from "react-feather";
import { SHADOW } from "../theme";
import { Input } from "@rebass/forms";

function Home() {
  return (
    <Box>
      <Input
        placeholder="Search"
        fontFamily="body"
        fontWeight="body"
        fontSize="input"
        bg="navbg"
        my={2}
        px={3}
        py={3}
        sx={{
          boxShadow: SHADOW,
          borderWidth: 0,
          borderRadius: "default"
        }}
      />
      <Box bg="navbg" px={3} py={3} sx={{ borderRadius: "default" }}>
        <Flex flexDirection="row" justifyContent="space-between">
          <Text fontFamily="body" fontSize="title" fontWeight="bold">
            This is a note title
          </Text>
          <Icon.MoreVertical
            size={20}
            strokeWidth={1.5}
            style={{ marginRight: -5 }}
          />
        </Flex>
        <Text fontFamily="body" fontSize="body" sx={{ marginTop: 1 }}>
          You are born to be the greatest there ever was. Embrace your true
          powers!
        </Text>
        <Text fontFamily="body" fontWeight="body" fontSize={12} color="accent">
          5 hours ago
        </Text>
      </Box>
    </Box>
  );
}

export default Home;
