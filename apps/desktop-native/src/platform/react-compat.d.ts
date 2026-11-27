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

// apps/web is on React 18, whose types let `useRef<T>()` take no argument;
// React 19's types (this app's) require one. React 19 itself still accepts the
// call (the ref starts as `undefined`), so this restores the React 18 overload
// for code shared with apps/web.
import "react";

declare module "react" {
  function useRef<T = undefined>(): MutableRefObject<T | undefined>;
}
