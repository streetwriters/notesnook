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

import module_svg from "./module-svg";

export const QRCode = module_svg.QRCode;

// React.lazy(async () => {
//   const module = await (await import('./module-svg')).default;
//   return {
//     default: module.QRCode
//   };
// });

export const SvgXml = module_svg.SvgXml;

// React.lazy(async () => {
//   const module = await (await import('./module-svg')).default;
//   return {
//     default: module.SvgXml
//   };
// });

export const ProgressBarComponent = module_svg.Progress.Bar;

// React.lazy(async () => {
//   const module = await (await import('./module-svg')).default;
//   return {
//     default: module.Progress.Bar
//   };
// });

export const ProgressCircleComponent = module_svg.Progress.Circle;

// React.lazy(async () => {
//   const module = await (await import('./module-svg')).default;
//   return {
//     default: module.Progress.Circle
//   };
// });
