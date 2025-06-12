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

export async function inlineStylesheets(options?: FetchOptions) {
  for (const sheet of document.styleSheets) {
    if (await skipStyleSheet(sheet, options)) continue;
  }
  await resolveImports(options);
}

async function resolveImports(options?: FetchOptions) {
  for (const sheet of document.styleSheets) {
    const rulesToDelete = [];
    if (await skipStyleSheet(sheet, options)) continue;

    for (let i = 0; i < sheet.cssRules.length; ++i) {
      const rule = sheet.cssRules.item(i);
      if (!rule) continue;

      if (rule.type === CSSRule.IMPORT_RULE) {
        const href = (rule as CSSImportRule).href;
        const result = await downloadStylesheet(href, options);
        if (result) {
          if (sheet.ownerNode) sheet.ownerNode.before(result);
          else document.head.appendChild(result);
          rulesToDelete.push(i);
        }
      }
    }

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
    if (sheet.href && node instanceof HTMLLinkElement) {
      const styleNode = await downloadStylesheet(node.href, options);
      if (styleNode) node.replaceWith(styleNode);
    }
    return true;
  }

  return sheet.media.mediaText
    .split(",")
    .map((t) => t.trim())
    .includes("print");
}

export async function addStylesToHead(
  head: HTMLHeadElement,
  options?: FetchOptions
) {
  for (const sheet of document.styleSheets) {
    const node = sheet.ownerNode;
    const href =
      sheet.href && node instanceof HTMLLinkElement
        ? node.href
        : node instanceof HTMLStyleElement
        ? node.getAttribute("href")
        : null;
    if (href) {
      const styleNode = await downloadStylesheet(href, options);
      if (styleNode) {
        head.appendChild(styleNode);
      }
      continue;
    }

    if (sheet.cssRules.length) {
      const styleNode = rulesToStyleNode(sheet.cssRules);
      head.appendChild(styleNode);
      continue;
    }

    if (node instanceof HTMLStyleElement) {
      head.appendChild(node.cloneNode(true));
    }
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
