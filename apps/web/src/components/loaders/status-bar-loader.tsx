import { memo } from "react";
import Skeleton from "react-loading-skeleton";
import { Box } from "rebass";
import "react-loading-skeleton/dist/skeleton.css";

export const StatusBarLoader = memo(function StatusBarLoader() {
  return (
    <Box
      bg="bgSecondary"
      display={["none", "flex"]}
      sx={{ borderTop: "1px solid", borderTopColor: "border" }}
      justifyContent="space-between"
      px={2}
      height={27}
    >
      <Skeleton
        width={80}
        height={16}
        baseColor="var(--border)"
        borderRadius={5}
      />
    </Box>
  );
});
