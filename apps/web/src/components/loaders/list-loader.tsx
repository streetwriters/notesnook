/*
This file is part of the Notesnook project (https://notesnook.com/)

Copyright (C) 2023 Streetwriters (Private) Limited

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

import { memo } from "react";
import Skeleton from "react-loading-skeleton";
import { Box, Flex } from "@theme-ui/components";
import "react-loading-skeleton/dist/skeleton.css";
import { getRandomArbitrary } from "../../utils/random";

const Lines = [1, 2, 3, 4].map(() => getRandomArbitrary(40, 90));
export const ListLoader = memo(function ListLoader() {
  return (
    <>
      <Flex
        sx={{ py: 1, alignItems: "center", justifyContent: "center", px: 1 }}
      >
        <Box sx={{ height: 38 }}>
          <Skeleton width={38} height={38} circle />
        </Box>
        <Flex
          sx={{
            flex: 1,
            ml: 1,
            flexDirection: "column",
            justifyContent: "center"
          }}
        >
          <Box sx={{ height: 14 }}>
            <Skeleton inline height={14} />
          </Box>
          <Box sx={{ mt: 1, height: 10 }}>
            <Skeleton inline height={10} />
          </Box>
        </Flex>
      </Flex>
      {Lines.map((width) => (
        <Box key={width} sx={{ py: 2, px: 1 }}>
          <Skeleton
            height={16}
            width={`${width}%`}
            style={{ marginBottom: 5 }}
          />
          <Skeleton height={12} count={2} />
          <Flex>
            <Skeleton height={10} inline width={50} />
            <Skeleton
              height={10}
              inline
              width={10}
              circle
              style={{ marginLeft: 5 }}
            />
            <Skeleton
              height={10}
              inline
              width={10}
              circle
              style={{ marginLeft: 5 }}
            />
          </Flex>
        </Box>
      ))}
    </>
  );
});
