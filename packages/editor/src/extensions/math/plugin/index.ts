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

/*---------------------------------------------------------
 *  Author: Benjamin R. Bray
 *  License: MIT (see LICENSE in project root for details)
 *--------------------------------------------------------*/

// core functionality
export { MathView, type ICursorPosObserver } from "./math-node-view.js";
export {
  mathPlugin,
  createMathView,
  type IMathPluginState
} from "./math-plugin.js";

// recommended plugins
export { mathBackspaceCmd } from "./plugins/math-backspace.js";

// optional / experimental plugins
export { mathSelectPlugin } from "./plugins/math-select.js";

// commands
export { insertMathNode } from "./commands/insert-math-node.js";

// utilities
export { mathSerializer } from "./utils/text-serializer.js";
export * from "./utils/types.js";
