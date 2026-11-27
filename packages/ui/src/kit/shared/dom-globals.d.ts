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

// Shared files (written for apps/web) type their refs with the DOM's names:
// `useRef<HTMLDivElement>(null)` passed to a kit element. A kit ref is a
// `UIElement`, which still has the deprecated `measureInWindow`, so a DOM
// element type is not assignable to it. Until that alias is removed, the DOM's
// `Element` gets the member here, which makes `HTMLDivElement` and the other
// element types fit a kit ref. On desktop every element is a kit element; on
// the web the kit's legacy shim (`web/legacy.tsx`) adds `measureInWindow` to
// the DOM node a kit ref receives. Remove this with the deprecated names.

import type { UIElement } from "../contracts";

declare global {
  interface Element {
    /** @deprecated Use `getBoundingClientRect`. */
    measureInWindow: UIElement["measureInWindow"];
  }
}
