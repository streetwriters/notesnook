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

type CrownProps = {
  size?: number;
  color?: string;
};

export function Crown({ size = 13, color = "icon" }: CrownProps) {
  return (
    <Box
      aria-hidden="true"
      sx={{ width: size, height: size, flexShrink: 0, color }}
    >
      <svg width="100%" height="100%" viewBox="0 0 13 13" fill="none">
        <path
          d="M12.175 4.61102C12.175 4.6166 12.175 4.62168 12.1715 4.62727L11.0198 9.90192C10.9843 10.0877 10.8852 10.2552 10.7395 10.3757C10.5937 10.4962 10.4106 10.5621 10.2215 10.5621H2.77847C2.58947 10.562 2.40641 10.496 2.26079 10.3755C2.11518 10.2551 2.01613 10.0876 1.98069 9.90192L0.828976 4.62727C0.828976 4.62168 0.826437 4.6166 0.825421 4.61102C0.7939 4.43638 0.82042 4.25623 0.900929 4.09808C0.981438 3.93994 1.11151 3.8125 1.27127 3.73524C1.43102 3.65798 1.61168 3.63515 1.78564 3.67023C1.95959 3.70532 2.11728 3.79639 2.2346 3.92953L3.94441 5.77239L5.76237 1.69516C5.76246 1.69347 5.76246 1.69177 5.76237 1.69008C5.82738 1.54908 5.93143 1.42967 6.06219 1.34596C6.19296 1.26226 6.34497 1.21777 6.50023 1.21777C6.65549 1.21777 6.8075 1.26226 6.93826 1.34596C7.06903 1.42967 7.17307 1.54908 7.23808 1.69008C7.23799 1.69177 7.23799 1.69347 7.23808 1.69516L9.05605 5.77239L10.7659 3.92953C10.8834 3.79738 11.0409 3.7072 11.2144 3.67269C11.3879 3.63817 11.5679 3.66122 11.7271 3.73831C11.8862 3.81541 12.0159 3.94235 12.0964 4.09986C12.1769 4.25737 12.2038 4.43684 12.173 4.61102H12.175Z"
          fill="currentColor"
        />
      </svg>
    </Box>
  );
}
