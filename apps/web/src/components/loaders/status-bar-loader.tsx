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
import { Box } from "@theme-ui/components";
import "react-loading-skeleton/dist/skeleton.css";

export const StatusBarLoader = memo(function StatusBarLoader() {
  return (
    <Box
      bg="bgSecondary"
      sx={{
        borderTop: "1px solid",
        borderTopColor: "border",
        justifyContent: "space-between",
        height: 27,
        display: ["none", "flex"]
      }}
      px={2}
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
