import { memo } from "react";
import Skeleton from "react-loading-skeleton";
import { Box, Flex } from "rebass";
import "react-loading-skeleton/dist/skeleton.css";

export const NavigationLoader = memo(function NavigationLoader() {
  return (
    <Flex
      id="navigationmenu"
      flexDirection="column"
      flex={1}
      sx={{
        zIndex: 1,
        position: "relative",
      }}
      bg={"bgSecondary"}
    >
      {[0, 1, 2, 3, 4, 5].map(() => (
        <Flex
          px={2}
          py={"9px"}
          mx={1}
          mt={"3px"}
          sx={{
            position: "relative",
            ":first-of-type": { mt: 1 },
            ":last-of-type": { mb: 1 },
          }}
        >
          <Skeleton
            height={20}
            width={20}
            inline
            circle
            baseColor="var(--border)"
          />
          <Box sx={{ flex: 1, ml: 1 }}>
            <Skeleton
              height={18}
              inline
              baseColor="var(--border)"
              borderRadius={5}
            />
          </Box>
        </Flex>
      ))}
    </Flex>
  );
});
