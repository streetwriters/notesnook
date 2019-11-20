import React from "react";
import { Button, Box, Text } from "rebass";

const items = ["Notes", "All", "Add", "Edit"];
function SideBar() {
  return (
    <Box>
      {items.map((v, i) => (
        <Button variant="primary">
          <Text color="background" bg="primary">
            {v}
          </Text>
        </Button>
      ))}
    </Box>
  );
}

export default SideBar;
