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

// The apps/web switch-over proof (plan item 5.3): repoint apps/web's
// theme-ui components, react-virtuoso and react-modal imports at
// `@notesnook/ui-kit`, and tell import edits apart from every other change.

export const KIT = "@notesnook/ui-kit";
export const SWITCHED = ["@theme-ui/components", "react-virtuoso", "react-modal"];

// One import or re-export declaration, single- or multi-line.
const DECLARATION =
  /^[ \t]*(?:import|export)\s+(?:type\s+)?(?:[^;'"]*?\sfrom\s+)?["'][^"']+["'];?[ \t]*$/gm;

/**
 * Rewrites the imports of the switched modules to the kit. react-modal's
 * default export is the kit's `Modal`, so `import ReactModal from
 * "react-modal"` becomes `import { Modal as ReactModal } from ...`.
 */
export function switchImports(source) {
  let count = 0;
  const code = source.replace(DECLARATION, (decl) => {
    const from = /["']([^"']+)["'];?[ \t]*$/.exec(decl)[1];
    if (!SWITCHED.includes(from)) return decl;
    count++;
    let out = decl.replace(/(["'])[^"']+\1/, `"${KIT}"`);
    if (from === "react-modal") {
      const def = /^([ \t]*import\s+(?:type\s+)?)([A-Za-z_$][\w$]*)\s+from/.exec(
        out
      );
      if (def) out = out.replace(def[0], `${def[1]}{ Modal as ${def[2]} } from`);
    }
    return out;
  });
  return { code, count };
}

/** The source with every import and re-export declaration removed. */
export function stripImports(source) {
  return source
    .replace(DECLARATION, "")
    .split("\n")
    .filter((line) => line.trim() !== "");
}

/**
 * The lines that differ between two versions of a file once their import
 * declarations are removed: `-` lines only in `before`, `+` only in `after`.
 */
export function nonImportChanges(before, after) {
  const a = stripImports(before);
  const b = stripImports(after);
  let start = 0;
  while (start < a.length && start < b.length && a[start] === b[start]) start++;
  let endA = a.length;
  let endB = b.length;
  while (endA > start && endB > start && a[endA - 1] === b[endB - 1]) {
    endA--;
    endB--;
  }
  const midA = a.slice(start, endA);
  const midB = b.slice(start, endB);
  // Longest common subsequence over what is left; the middles are small.
  const dp = Array.from({ length: midA.length + 1 }, () =>
    new Array(midB.length + 1).fill(0)
  );
  for (let i = midA.length - 1; i >= 0; i--)
    for (let j = midB.length - 1; j >= 0; j--)
      dp[i][j] =
        midA[i] === midB[j]
          ? dp[i + 1][j + 1] + 1
          : Math.max(dp[i + 1][j], dp[i][j + 1]);
  const out = [];
  let i = 0;
  let j = 0;
  while (i < midA.length || j < midB.length) {
    if (i < midA.length && j < midB.length && midA[i] === midB[j]) {
      i++;
      j++;
    } else if (j >= midB.length || (i < midA.length && dp[i + 1][j] >= dp[i][j + 1]))
      out.push(`-${midA[i++]}`);
    else out.push(`+${midB[j++]}`);
  }
  return out;
}
