import { memo } from "react";
import Skeleton from "react-loading-skeleton";
import { Box, Flex } from "rebass";
import "react-loading-skeleton/dist/skeleton.css";
import { getRandomArbitrary } from "../../utils/random";

const Lines = [1, 2, 3, 4].map(() => getRandomArbitrary(40, 90));
export const ListLoader = memo(function ListLoader() {
  return (
    <>
      <Flex alignItems="center" justifyContent={"center"} sx={{ py: 1, mx: 1 }}>
        <Box height={38}>
          <Skeleton width={38} height={38} circle />
        </Box>
        <Flex
          sx={{
            flex: 1,
            ml: 1,
            flexDirection: "column",
            justifyContent: "center",
          }}
        >
          <Box height={14}>
            <Skeleton inline height={14} />
          </Box>
          <Box height={10} sx={{ mt: 1 }}>
            <Skeleton inline height={10} />
          </Box>
        </Flex>
      </Flex>
      {Lines.map((width) => (
        <Box sx={{ py: 2, px: 1 }}>
          <Skeleton
            height={16}
            baseColor="var(--border)"
            width={`${width}%`}
            style={{ marginBottom: 5 }}
          />
          <Skeleton height={12} count={2} baseColor="var(--hover)" />
          <Flex>
            <Skeleton height={10} inline width={50} baseColor="var(--hover)" />
            <Skeleton
              height={10}
              inline
              width={10}
              baseColor="var(--shade)"
              circle
              style={{ marginLeft: 5 }}
            />
            <Skeleton
              height={10}
              inline
              width={10}
              baseColor="var(--hover)"
              circle
              style={{ marginLeft: 5 }}
            />
          </Flex>
        </Box>
      ))}
    </>
  );
});
