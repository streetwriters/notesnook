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
import { FetchOptions } from "./fetch.js";
import { inlineAll, shouldProcess } from "./inliner.js";

async function resolveAll(options?: FetchOptions) {
  const fonts = readAll();
  const cssStrings: string[] = [];
  for (const font of fonts) {
    cssStrings.push(await font.resolve(options));
  }
  return cssStrings.join("\n");
}

function readAll() {
  const cssRules = getWebFonts(document.styleSheets);
  const fonts = selectWebFontRules(cssRules);
  return fonts.map(newWebFont);
}

function getWebFonts(styleSheets: StyleSheetList) {
  const cssRules: CSSFontFaceRule[] = [];
  for (const sheet of styleSheets) {
    try {
      const allFonts = selectWebFontRules(Array.from(sheet.cssRules));
      if (allFonts.length > 3) cssRules.push(allFonts[0]);
    } catch (e) {
      if (e instanceof Error) {
        console.log(
          "Error while reading CSS rules from " + sheet.href,
          e.toString()
        );
      }
    }
  }
  return cssRules;
}

function newWebFont(webFontRule: CSSFontFaceRule) {
  return {
    resolve: function resolve(options?: FetchOptions) {
      const baseUrl = (webFontRule.parentStyleSheet || {}).href || undefined;
      return inlineAll(webFontRule.cssText, options, baseUrl);
    },
    src: function () {
      return webFontRule.style.getPropertyValue("src");
    }
  };
}

function selectWebFontRules(cssRules: CSSRule[]): CSSFontFaceRule[] {
  return cssRules
    .filter(function (rule) {
      return rule.type === CSSRule.FONT_FACE_RULE;
    })
    .filter(function (rule) {
      return shouldProcess(
        (rule as CSSFontFaceRule).style.getPropertyValue("src")
      );
    }) as CSSFontFaceRule[];
}

export { resolveAll };
