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

export const EditorLoader = memo(function EditorLoader() {
  return (
    <Flex sx={{ flexDirection: "column", p: 2, py: 1 }}>
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
