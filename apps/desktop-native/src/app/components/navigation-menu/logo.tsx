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

import { Box } from "@ui";
import { svgIcon } from "../icon-factory";

const LOGO_MARK = svgIcon(
  '<svg viewBox="0 0 1000 1000" xmlns="http://www.w3.org/2000/svg"><g transform="translate(275,176.95254)"><path fill="currentColor" d="M437.985 493.919c-17.255 50.411-51.835 93.065-97.588 120.372-45.752 27.307-99.71 37.496-152.269 28.753-52.56-8.743-100.313999-35.85-134.763-76.498C18.916 525.898.006 474.347 0 421.064v-110.25l79.121001 33.053v77.152c-.007 20.779 4.434 41.318 13.024 60.237C100.735 500.176 113.276 517.037 128.925 530.707c2.97 2.587 6.053 5.107 9.236 7.459 23.357 17.388 51.402 27.352 80.494 28.597.99 0 1.946.079 2.925.101.979.023 2.25 0 3.375 0h3.375c1.125 0 1.935 0 2.925-.101 29.081-1.248 57.116-11.203 80.471-28.575 3.173-2.351 6.255-4.86 9.237-7.447 20.556-17.98 35.656-41.366 43.582-67.5zM450 225v196.065c0 2.531 0 5.074-.158 7.605l-78.963-33.019V225c-.013-37.684-14.607-73.901-40.725-101.066-26.119-27.164003-61.735-43.168003-99.389-44.660003-37.655-1.492-74.426 11.644-102.611 36.657003-28.185999 25.013-45.599999 59.962-48.593999 97.526-.281 3.803-.439 7.662-.439 11.543v48.712L0 240.637V0h225c59.674 0 116.903 23.705 159.099 65.901C426.295 108.097 450 165.326 450 225Z"/></g></svg>'
);

export function Logo({ size }: { size: number }) {
  return (
    <Box
      sx={{
        width: size,
        height: size,
        borderRadius: size * 0.3,
        bg: "heading"
      }}
    >
      <LOGO_MARK size={size} color="background" />
    </Box>
  );
}
