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

export interface MathConverter {
  (latex: string): string;
}

let loaded: Promise<MathConverter | null> | undefined;

export function loadMathConverter(): Promise<MathConverter | null> {
  loaded ??= import("tex2typst").then(
    (module) => (latex: string) => module.tex2typst(latex),
    () => null
  );
  return loaded;
}

const UNSAFE = /[#`]|\/\/|\/\*|\*\//;

/**
 * Typst math for a LaTeX string, or `undefined` when the conversion fails or
 * produces something that could be read as code, so the caller falls back to
 * the raw LaTeX.
 */
export function toTypstMath(
  latex: string,
  convert: MathConverter | null
): string | undefined {
  if (!convert) return undefined;
  const source = latex.trim();
  if (!source || source.length > 20_000) return undefined;
  let out: string;
  try {
    out = convert(source).trim();
  } catch {
    return undefined;
  }
  if (!out || UNSAFE.test(out.replace(/"(?:[^"\\]|\\.)*"/g, '""'))) return undefined;
  if ((out.match(/"/g)?.length ?? 0) % 2 !== 0) return undefined;
  return out;
}
