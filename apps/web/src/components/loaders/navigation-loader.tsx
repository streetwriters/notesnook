/*
This file is part of the Notesnook project (https://notesnook.com/)

Copyright (C) 2022 Streetwriters (Private) Limited

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

export const NavigationLoader = memo(function NavigationLoader() {
  return (
    <Flex
      id="navigation-menu"
      sx={{
        height: "100%",
        zIndex: 1,
        position: "relative",
        flex: 1,
        flexDirection: "column"
      }}
      bg={"bgSecondary"}
    >
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <Flex
          key={i}
          px={2}
          py={"9px"}
          mx={1}
          mt={"3px"}
          sx={{
            position: "relative",
            ":first-of-type": { mt: 1 },
            ":last-of-type": { mb: 1 }
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
