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

/**
 * Issue #9423: Spell-check tests for Spanish dictionaries
 */

import { describe, it, expect } from "vitest";

const BROKEN_SPANISH_TO_WORKING: Record<string, string> = {
  es: "es-MX",
  "es-419": "es-MX",
  "es-ES": "es-AR"
};

function resolveLanguageCodes(
  requested: string[],
  available: string[]
): string[] {
  return requested.map((code) => {
    if (BROKEN_SPANISH_TO_WORKING[code]) {
      const working = BROKEN_SPANISH_TO_WORKING[code];
      return available.includes(working) ? working : code;
    }
    return available.includes(code) ? code : code.split("-")[0];
  });
}

describe("Issue #9423: Spanish Dictionaries", () => {
  it("maps broken es to es-MX", () => {
    expect(resolveLanguageCodes(["es"], ["es-MX"])).toEqual(["es-MX"]);
  });

  it("maps broken es-419 to es-MX", () => {
    expect(resolveLanguageCodes(["es-419"], ["es-MX"])).toEqual(["es-MX"]);
  });

  it("maps broken es-ES to es-AR", () => {
    expect(resolveLanguageCodes(["es-ES"], ["es-AR"])).toEqual(["es-AR"]);
  });

  it("preserves working Spanish variants", () => {
    expect(
      resolveLanguageCodes(
        ["es-AR", "es-MX", "es-US"],
        ["es-AR", "es-MX", "es-US"]
      )
    ).toEqual(["es-AR", "es-MX", "es-US"]);
  });

  it("handles mixed broken and working Spanish", () => {
    expect(
      resolveLanguageCodes(["es-ES", "es-MX"], ["es-AR", "es-MX"])
    ).toEqual(["es-AR", "es-MX"]);
  });

  it("handles Spanish with other languages", () => {
    expect(
      resolveLanguageCodes(
        ["en-US", "es-ES", "fr-FR"],
        ["en-US", "es-AR", "fr-FR"]
      )
    ).toEqual(["en-US", "es-AR", "fr-FR"]);
  });

  it("handles regional fallback", () => {
    expect(resolveLanguageCodes(["de-AT", "fr-CA"], ["de", "fr"])).toEqual([
      "de",
      "fr"
    ]);
  });
});
