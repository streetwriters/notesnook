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
import { getRandomArbitrary } from "@notesnook/common";
import { Box, Flex, type SxProp } from "@ui";

const SHIMMER: SxProp = {
  animation: {
    keyframes: {
      from: { opacity: 1 },
      "50%": { opacity: 0.45 },
      to: { opacity: 1 }
    },
    duration: 1500,
    iterationCount: "infinite",
    easing: "ease-in-out"
  }
};

const Lines = [1, 2].map(() => getRandomArbitrary(40, 90));

function Bone(props: {
  height: number;
  width: number | `${number}%`;
  circle?: boolean;
  shimmer?: boolean;
  ml?: number;
  mb?: number;
}) {
  return (
    <Box
      sx={{
        height: props.height,
        width: props.width,
        bg: "background-secondary",
        borderRadius: props.circle ? props.height : 4,
        ml: props.ml,
        mb: props.mb,
        ...(props.shimmer ? SHIMMER : undefined)
      }}
    />
  );
}

export const ListLoader = memo(function ListLoader() {
  return (
    <Flex testID="list-loader" sx={{ flexDirection: "column" }}>
      {Lines.map((width) => (
        <Box key={width} sx={{ py: 2, px: 1 }}>
          <Bone height={16} width={`${width}%`} mb={5} />
          <Bone height={12} width="100%" shimmer />
          <Bone height={12} width="100%" shimmer />
          <Flex sx={{ flexDirection: "row" }}>
            <Bone height={10} width={50} />
            <Bone height={10} width={10} circle ml={5} />
            <Bone height={10} width={10} circle ml={5} />
          </Flex>
        </Box>
      ))}
    </Flex>
  );
});
