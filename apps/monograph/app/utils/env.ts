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

const p = "process" in globalThis ? globalThis.process : ({ env: {} } as any);
export const API_HOST =
  import.meta.env.API_HOST || p.env.API_HOST || `https://api.notesnook.com`;
export const PUBLIC_URL =
  import.meta.env.PUBLIC_URL ||
  p.env.PUBLIC_URL ||
  `http://localhost:${import.meta.env.PORT || p.env.PORT || 5173}`;
export const COMPATIBILITY_VERSION = 1;
export const INSTANCE_NAME = p.env.INSTANCE_NAME || "default";
