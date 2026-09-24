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

import { Box } from "@theme-ui/components";

type CheckProps = {
  size?: number;
  color?: string;
};

export function Check({ size = 13, color = "icon" }: CheckProps) {
  return (
    <Box
      aria-hidden="true"
      sx={{ width: size, height: size, flexShrink: 0, color }}
    >
      <svg width="100%" height="100%" viewBox="0 0 16 16" fill="none">
        <path
          d="M14.3538 4.85354L6.35378 12.8535C6.30735 12.9 6.2522 12.9369 6.1915 12.9621C6.13081 12.9872 6.06574 13.0002 6.00003 13.0002C5.93433 13.0002 5.86926 12.9872 5.80856 12.9621C5.74787 12.9369 5.69272 12.9 5.64628 12.8535L2.14628 9.35354C2.05246 9.25972 1.99976 9.13247 1.99976 8.99979C1.99976 8.86711 2.05246 8.73986 2.14628 8.64604C2.2401 8.55222 2.36735 8.49951 2.50003 8.49951C2.63272 8.49951 2.75996 8.55222 2.85378 8.64604L6.00003 11.7929L13.6463 4.14604C13.7401 4.05222 13.8674 3.99951 14 3.99951C14.1327 3.99951 14.26 4.05222 14.3538 4.14604C14.4476 4.23986 14.5003 4.36711 14.5003 4.49979C14.5003 4.63247 14.4476 4.75972 14.3538 4.85354Z"
          fill="currentColor"
        />
      </svg>
    </Box>
  );
}
