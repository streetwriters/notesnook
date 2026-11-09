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

import type { Declarations } from "./convert";

const STATE_SELECTORS: [RegExp, string][] = [
  [/^&?:hover(:not\([^)]*\))*$/, ":hover"],
  [/^&?:active(:not\([^)]*\))*$/, ":active"],
  [/^&?:focus-visible(:not\([^)]*\))*$/, ":focus-visible"],
  [/^&?:focus(:not\([^)]*\))*$/, ":focus"]
];

function resolveVariables(value: unknown, colors: Record<string, string>) {
  if (typeof value !== "string") return value;
  const stripped = value.replace(/\s*!important\s*$/, "");
  const match = /^var\(--([\w-]+)\)$/.exec(stripped);
  if (match) return colors[match[1]] ?? stripped;
  return stripped.replace(
    /var\(--([\w-]+)\)/g,
    (whole, name: string) => colors[name] ?? whole
  );
}

export function normalizeVariant(
  variant: Declarations | undefined,
  colors: Record<string, string>
): Declarations {
  if (!variant) return {};
  const result: Declarations = {};
  for (const key in variant) {
    const value = variant[key];
    if (value && typeof value === "object" && !Array.isArray(value)) {
      const state = STATE_SELECTORS.find(([pattern]) => pattern.test(key));
      if (!state) continue;
      const inner = normalizeVariant(value as Declarations, colors);
      result[state[1]] = { ...(result[state[1]] as Declarations), ...inner };
      continue;
    }
    result[key] = resolveVariables(value, colors);
  }
  return result;
}
