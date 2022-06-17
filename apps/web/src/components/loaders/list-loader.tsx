import { memo } from "react";
import Skeleton from "react-loading-skeleton";
import { Box, Flex } from "rebass";
import "react-loading-skeleton/dist/skeleton.css";
import { getRandomArbitrary } from "../../utils/random";

const Lines = [1, 2, 3, 4].map(() => getRandomArbitrary(40, 90));
export const ListLoader = memo(function ListLoader() {
  return (
    <>
      <Flex alignItems="center" justifyContent={"center"} p={1}>
        <Skeleton width={40} height={40} circle />
        <Box sx={{ flex: 1, ml: 1, mt: 2 }}>
          <Skeleton height={12} />
          <Skeleton height={8} />
        </Box>
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
