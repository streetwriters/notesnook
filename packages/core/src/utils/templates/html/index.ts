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

import { TemplateData } from "../index.js";
import { parseHTML } from "../../html-parser.js";
import { hasRequire } from "../../has-require.js";
import { loadLanguage } from "./languages/index.js";
import { template } from "./template.js";

const replaceableAttributes = {
  'data-float="true" data-align="right"': 'align="right"',
  'data-float="true" data-align="left"': 'align="left"',
  'data-align="left"':
    'style="margin-right:auto;margin-left:0;display: block;"',
  'data-align="right"':
    'style="margin-left:auto;margin-right:0;display: block;"',
  'data-align="center"':
    'style="margin-left:auto;margin-right:auto;display: block;"'
};

const LANGUAGE_REGEX = /(?:^|\s)lang(?:uage)?-([\w-]+)(?=\s|$)/i;

export async function buildHTML(templateData: TemplateData) {
  return template(await preprocessHTML(templateData));
}

async function preprocessHTML(templateData: TemplateData) {
  const { content } = templateData;

  let html = content.replace(/<p([^>]*)><\/p>/gm, "<p$1><br/></p>");
  for (const attribute in replaceableAttributes) {
    const value =
      replaceableAttributes[attribute as keyof typeof replaceableAttributes];
    while (html.includes(attribute)) html = html.replace(attribute, value);
  }

  const doc = parseHTML(html);
  if (!doc) throw new Error("Could not parse HTML to DOM.");

  const images = doc.querySelectorAll("img");
  for (const image of images) {
    const container = doc.createElement("span");
    container.append(image.cloneNode());
    for (const attr of image.attributes) {
      if (
        attr.name === "src" ||
        attr.name === "height" ||
        attr.name === "width"
      )
        continue;
      container.setAttribute(attr.name, attr.value);
    }
    container.classList.add("image-container");
    image.replaceWith(container);
  }

  const mathBlocks = doc.querySelectorAll(".math-block.math-node");
  const mathInlines = doc.querySelectorAll(".math-inline.math-node");

  if (mathBlocks.length || mathInlines.length) {
    const katex = (await import("katex")).default;
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    await import("katex/contrib/mhchem/mhchem.js");
    for (const mathBlock of mathBlocks) {
      const text = mathBlock.textContent || "";
      mathBlock.innerHTML = katex.renderToString(text, {
        displayMode: true,
        throwOnError: false
      });
    }

    for (const mathInline of mathInlines) {
      const text = mathInline.textContent || "";
      mathInline.innerHTML = katex.renderToString(text, {
        throwOnError: false,
        displayMode: false
      });
    }
  }

  const codeblocks = doc.querySelectorAll("pre > code");
  if (codeblocks.length) {
    const { default: prismjs } = await import("prismjs");
    // const { loadLanguage } = await import("./languages/index.js");
    (prismjs as any).register = (syntax: (syntax: any) => void) => {
      if (typeof syntax === "function") syntax(prismjs);
    };
    for (const codeblock of codeblocks) {
      if (!codeblock.parentElement) continue;
      const language = LANGUAGE_REGEX.exec(
        codeblock.parentElement.className
      )?.[1];
      if (!language) continue;

      const { default: grammar } = (await loadLanguage(language)) || {};
      if (!grammar) continue;

      grammar(prismjs);
      if (!prismjs.languages[language]) continue;

      codeblock.innerHTML = prismjs.highlight(
        codeblock.textContent || "",
        prismjs.languages[language],
        language
      );
    }
  }

  templateData.content = doc.body.innerHTML;
  return templateData;
}
