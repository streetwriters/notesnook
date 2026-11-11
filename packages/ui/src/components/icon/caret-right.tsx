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

type CaretRightProps = {
  size?: number;
  color?: string;
};

export function CaretRight({ size = 13, color = "icon" }: CaretRightProps) {
  return (
    <Box
      aria-hidden="true"
      sx={{ width: size, height: size, flexShrink: 0, color }}
    >
      <svg width="100%" height="100%" viewBox="0 0 11 11" fill="none">
        <path
          d="M7.80589 5.74339L4.36839 9.18089C4.33646 9.21283 4.29854 9.23817 4.25681 9.25545C4.21508 9.27274 4.17036 9.28163 4.12519 9.28163C4.08002 9.28163 4.0353 9.27274 3.99357 9.25545C3.95184 9.23817 3.91393 9.21283 3.88199 9.18089C3.85005 9.14896 3.82472 9.11104 3.80743 9.06931C3.79015 9.02758 3.78125 8.98286 3.78125 8.93769C3.78125 8.89252 3.79015 8.8478 3.80743 8.80607C3.82472 8.76434 3.85005 8.72643 3.88199 8.69449L7.07671 5.50019L3.88199 2.30589C3.81749 2.24139 3.78125 2.15391 3.78125 2.06269C3.78125 1.97147 3.81749 1.88399 3.88199 1.81949C3.94649 1.75499 4.03397 1.71875 4.12519 1.71875C4.21641 1.71875 4.30389 1.75499 4.36839 1.81949L7.80589 5.25699C7.83785 5.28891 7.86321 5.32682 7.88051 5.36856C7.89781 5.41029 7.90671 5.45502 7.90671 5.50019C7.90671 5.54537 7.89781 5.5901 7.88051 5.63183C7.86321 5.67356 7.83785 5.71147 7.80589 5.74339Z"
          fill="currentColor"
        />
      </svg>
    </Box>
  );
}
