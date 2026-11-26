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
import { useRef } from "react";

// Uses raw DOM methods on a ref. The kit has none of them, so the check must
// fail with a planned fix for each, not pass them as exceptions.
export function Planned() {
  const ref = useRef(null);
  const read = () => [
    ref.current.closest("div"),
    ref.current.querySelector("p")
  ];
  return <Box ref={ref} onClick={read} />;
}
