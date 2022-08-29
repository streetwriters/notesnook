import { memo } from "react";
import Skeleton from "react-loading-skeleton";
import { Box, Flex } from "@streetwriters/rebass";
import "react-loading-skeleton/dist/skeleton.css";

export const EditorLoader = memo(function EditorLoader() {
  return (
    <Flex sx={{ flexDirection: "column", p: 2 }}>
      <Flex sx={{ alignItems: "end", justifyContent: "end" }}>
        <Skeleton
          width={45}
          height={30}
          style={{ marginRight: 5 }}
          baseColor="var(--border)"
        />
        <Skeleton width={45} height={30} baseColor="var(--border)" />
      </Flex>
      <Skeleton
        height={39}
        style={{ marginTop: 20 }}
        baseColor="var(--border)"
      />
      <Box sx={{ mt: 4, mx: "5%" }}>
        <Skeleton height={56} width={300} baseColor="var(--border)" />
        <Skeleton
          height={22}
          style={{ marginTop: 15 }}
          count={3}
          baseColor="var(--border)"
        />
      </Box>
    </Flex>
  );
});
