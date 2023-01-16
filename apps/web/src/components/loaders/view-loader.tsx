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
import { ListLoader } from "./list-loader";

export const ViewLoader = memo(function ViewLoader() {
  return (
    <Box sx={{ my: 1 }}>
      <Flex sx={{ justifyContent: "space-between", py: 0, px: 1 }}>
        <Skeleton height={35} width={100} borderRadius={5} />
        <Flex>
          <Skeleton height={35} width={35} circle style={{ marginRight: 5 }} />
          <Skeleton height={35} width={35} circle />
        </Flex>
      </Flex>
      <ListLoader />
    </Box>
  );
});
