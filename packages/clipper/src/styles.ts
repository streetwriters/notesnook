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
import { constructUrl, FetchOptions } from "./fetch.js";
import { inlineAll } from "./inliner.js";

export async function inlineStylesheets(options?: FetchOptions) {
  for (const sheet of document.styleSheets) {
    const rulesToDelete = [];
    if (await skipStyleSheet(sheet, options)) continue;

    for (let i = 0; i < sheet.cssRules.length; ++i) {
      const rule = sheet.cssRules.item(i);
      if (!rule) continue;

      if (rule.type === CSSRule.IMPORT_RULE) {
        const href = (rule as CSSImportRule).href;
        const result = await downloadStylesheet(href, options);
        if (!result) continue;
        if (sheet.ownerNode) sheet.ownerNode.before(result);
        else document.head.appendChild(result);
        rulesToDelete.push(i);
      }
    }

    await inlineBackgroundImages(sheet, options);

    for (const ruleIndex of rulesToDelete) sheet.deleteRule(ruleIndex);
  }
}

async function downloadStylesheet(href: string, options?: FetchOptions) {
  try {
    const style = document.createElement("style");
    const response = await fetch(constructUrl(href, options));
    if (!response.ok) return false;
    style.innerHTML = await response.text();
    style.setAttribute("href", href);
    return style;
  } catch (e) {
    console.error("Failed to inline stylesheet", href, e);
  }
}

async function skipStyleSheet(sheet: CSSStyleSheet, options?: FetchOptions) {
  try {
    sheet.cssRules.length;
  } catch (_e) {
    const node = sheet.ownerNode;
    if (
      sheet.href &&
      node instanceof HTMLLinkElement &&
      !isStylesheetForPrint(node)
    ) {
      const styleNode = await downloadStylesheet(node.href, options);
      if (styleNode) node.replaceWith(styleNode);
    }
    return true;
  }

  return isStylesheetForPrint(sheet);
}

function isStylesheetForPrint(sheet: CSSStyleSheet | HTMLLinkElement) {
  const mediaText =
    typeof sheet.media === "string" ? sheet.media : sheet.media.mediaText;
  return mediaText
    .split(",")
    .map((t) => t.trim())
    .includes("print");
}

export function addStylesToHead(head: HTMLHeadElement, options?: FetchOptions) {
  for (const sheet of document.styleSheets) {
    if (isStylesheetForPrint(sheet)) continue;
    const styleNode = rulesToStyleNode(sheet.cssRules);
    head.appendChild(styleNode);
  }
}

function rulesToStyleNode(cssRules: CSSRuleList) {
  const cssText = Array.from(cssRules)
    .map((r) => r.cssText)
    .reduce((acc, text) => acc + text);
  const style = document.createElement("style");
  style.innerHTML = cssText;
  return style;
}

async function inlineBackgroundImages(
  sheet: CSSStyleSheet,
  options?: FetchOptions
) {
  const promises: Promise<void>[] = [];
  for (const rule of sheet.cssRules) {
    if (rule.type === CSSRule.STYLE_RULE) {
      promises.push(processStyleRule(sheet, rule as CSSStyleRule, options));
    } else if (rule.type === CSSRule.MEDIA_RULE) {
      const mediaRule = rule as CSSMediaRule;
      const mediaMatches = window.matchMedia(mediaRule.media.mediaText).matches;
      for (const innerRule of mediaRule.cssRules) {
        if (innerRule && innerRule.type === CSSRule.STYLE_RULE) {
          promises.push(
            processStyleRule(
              sheet,
              innerRule as CSSStyleRule,
              options,
              mediaMatches
            )
          );
        }
      }
    } else if (rule.type === CSSRule.SUPPORTS_RULE) {
      const supportsRule = rule as CSSSupportsRule;
      for (const innerRule of supportsRule.cssRules) {
        if (innerRule && innerRule.type === CSSRule.STYLE_RULE) {
          promises.push(
            processStyleRule(sheet, innerRule as CSSStyleRule, options, false)
          );
        }
      }
    }
  }
  await Promise.allSettled(promises);
}

async function processStyleRule(
  sheet: CSSStyleSheet,
  rule: CSSStyleRule,
  options?: FetchOptions,
  inline = true
) {
  const baseUrl = sheet.href || document.location.origin;
  for (const property of rule.style) {
    const oldValue = rule.style.getPropertyValue(property);
    const resolved = await inlineAll(oldValue, options, baseUrl, !inline);
    rule.style.setProperty(property, resolved);
  }
}
