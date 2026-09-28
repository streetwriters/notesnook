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

import { describe, it, expect } from "vitest";
import {
  getSupportedLocale,
  resolveTargetLocale,
  AVAILABLE_LANGUAGES
} from "@notesnook/intl";

describe("Locale Detection & Resolution", () => {
  describe("Exact matches for supported languages", () => {
    AVAILABLE_LANGUAGES.forEach(({ code }) => {
      it(`should correctly resolve exact match for "${code}"`, () => {
        expect(getSupportedLocale(code)).toBe(code);
      });
    });
  });

  describe("German regional variants resolve to 'de'", () => {
    const germanVariants = [
      "de-DE",
      "de-AT",
      "de-CH",
      "de-LU",
      "de-LI",
      "de_DE",
      "de_AT",
      "de_CH",
      "DE-DE",
      "de-1901"
    ];

    germanVariants.forEach((variant) => {
      it(`should map "${variant}" to "de"`, () => {
        expect(getSupportedLocale(variant)).toBe("de");
      });
    });
  });

  describe("Other regional variants resolve to base language", () => {
    const regionalCases: [string, string][] = [
      ["es-ES", "es"],
      ["es-MX", "es"],
      ["es-AR", "es"],
      ["es_CO", "es"],
      ["fr-FR", "fr"],
      ["fr-CA", "fr"],
      ["fr-BE", "fr"],
      ["fr_CH", "fr"],
      ["it-IT", "it"],
      ["it-CH", "it"],
      ["nl-NL", "nl"],
      ["nl-BE", "nl"],
      ["pl-PL", "pl"],
      ["ru-RU", "ru"],
      ["ru-BY", "ru"],
      ["tr-TR", "tr"],
      ["tr_CY", "tr"],
      ["uk-UA", "uk"],
      ["en-US", "en"],
      ["en-GB", "en"],
      ["en-AU", "en"],
      ["en-CA", "en"],
      ["pt-BR", "pt-BR"],
      ["pt-PT", "pt-BR"],
      ["pt", "pt-BR"]
    ];

    regionalCases.forEach(([input, expected]) => {
      it(`should map "${input}" to "${expected}"`, () => {
        expect(getSupportedLocale(input)).toBe(expected);
      });
    });
  });

  describe("Unsupported and invalid locales safely fall back to 'en'", () => {
    const unsupportedCases = [
      "ja-JP",
      "zh-CN",
      "zh-TW",
      "ar-SA",
      "ur-PK",
      "hi-IN",
      "ko-KR",
      "sv-SE",
      "da-DK",
      "fi-FI",
      "unknown",
      "invalid-locale-string",
      "",
      undefined
    ];

    unsupportedCases.forEach((input) => {
      it(`should fall back "${input}" to "en"`, () => {
        expect(getSupportedLocale(input)).toBe("en");
      });
    });
  });

  describe("resolveTargetLocale precedence", () => {
    it("should prioritize a valid saved language over systemLocale", () => {
      expect(resolveTargetLocale("fr", "de-DE")).toBe("fr");
      expect(resolveTargetLocale("tr", "en-US")).toBe("tr");
    });

    it("should use systemLocale when saved language is empty or undefined", () => {
      expect(resolveTargetLocale("", "de-AT")).toBe("de");
      expect(resolveTargetLocale(undefined, "tr-TR")).toBe("tr");
      expect(resolveTargetLocale(null, "es-MX")).toBe("es");
    });

    it("should fall back to systemLocale if saved language is invalid/unsupported", () => {
      expect(resolveTargetLocale("invalid-lang", "de-CH")).toBe("de");
    });
  });
});
