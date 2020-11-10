import React from "react";
import { Box, Text } from "rebass";

function GroupHeader(props) {
  const { title } = props;
  if (!title) return null;
  return (
    <Box my={2} bg="bgSecondary" px={2} py={1}>
      <Text variant="heading" color="primary" fontSize="subtitle">
        {title}
      </Text>
    </Box>
  );
}
export default GroupHeader;
