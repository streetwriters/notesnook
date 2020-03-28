import React from "react";
import { Flex } from "rebass";

function Placeholder(props) {
  const { items, renderItem } = props;
  return (
    <>
      <Flex
        variant="columnCenter"
        alignSelf="stretch"
        sx={{ position: "relative" }}
      >
        {items.map(renderItem)}
      </Flex>
    </>
  );
}
export default Placeholder;
