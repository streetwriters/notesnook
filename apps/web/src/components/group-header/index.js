import React from "react";
import { Box, Text } from "rebass";

function GroupHeader(props) {
  const { title } = props;
  if (title === "Pinned") return null;
  return (
    <Box height={22} mx={2} bg="background" py={0}>
      <Text variant="heading" color="primary" fontSize="subtitle">
        {title}
      </Text>
    </Box>
  );
}
export default GroupHeader;
