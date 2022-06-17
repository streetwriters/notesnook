import { memo } from "react";
import Skeleton from "react-loading-skeleton";
import { Box, Flex } from "rebass";
import "react-loading-skeleton/dist/skeleton.css";

export const EditorLoader = memo(function EditorLoader() {
  return (
    <Flex sx={{ flexDirection: "column", p: 2 }}>
      <Flex sx={{ alignItems: "end", justifyContent: "end" }}>
        <Skeleton width={45} height={30} style={{ marginRight: 5 }} />
        <Skeleton width={45} height={30} />
      </Flex>
      <Skeleton height={39} style={{ marginTop: 20 }} />
      <Box sx={{ mt: 4, mx: "5%" }}>
        <Skeleton height={56} width={300} />
        <Skeleton height={22} style={{ marginTop: 15 }} count={3} />
      </Box>
    </Flex>
  );
});
