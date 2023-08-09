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

import { parseHTML } from "../../html-parser";
import HTMLTemplate from "./template";

const LANGUAGE_REGEX = /(?:^|\s)lang(?:uage)?-([\w-]+)(?=\s|$)/i;

async function buildHTML(templateData) {
  return HTMLTemplate(await preprocessHTML(templateData));
}

async function preprocessHTML(templateData) {
  const { content } = templateData;
  const doc = parseHTML(
    content.replaceAll(/<p([^>]*)><\/p>/gm, "<p$1><br/></p>")
  );

  const mathBlocks = doc.querySelectorAll(".math-block.math-node");
  const mathInlines = doc.querySelectorAll(".math-inline.math-node");

  if (mathBlocks.length || mathInlines.length) {
    const katex = hasRequire()
      ? require("katex")
      : (await import("katex")).default;
    hasRequire()
      ? require("katex/contrib/mhchem/mhchem.js")
      : await import("katex/contrib/mhchem/mhchem.js");
    for (const mathBlock of mathBlocks) {
      const text = mathBlock.textContent;
      console.log(text);
      mathBlock.innerHTML = katex.renderToString(text, {
        displayMode: true,
        throwOnError: false
      });
    }

    for (const mathInline of mathInlines) {
      const text = mathInline.textContent;
      mathInline.innerHTML = katex.renderToString(text, {
        throwOnError: false,
        displayMode: false
      });
    }
    templateData.hasMathBlocks = true;
  }

  const codeblocks = doc.querySelectorAll("pre > code");
  if (codeblocks.length) {
    const prismjs = hasRequire()
      ? require("prismjs")
      : (await import("prismjs")).default;
    const { loadLanguage } = hasRequire()
      ? require("../../../../editor/languages/index.js")
      : await import("../../../../editor/languages/index.js");
    prismjs.register = (syntax) => {
      if (typeof arg === "function") syntax(prismjs);
    };
    for (const codeblock of codeblocks) {
      const language = LANGUAGE_REGEX.exec(
        codeblock.parentElement.className
      )?.[1];
      if (!language) continue;

      const { default: grammar } = await loadLanguage(language);
      grammar(prismjs);
      if (!prismjs.languages[language]) continue;

      codeblock.innerHTML = prismjs.highlight(
        codeblock.textContent,
        prismjs.languages[language],
        language
      );
    }
    templateData.hasCodeblock = true;
  }

  templateData.content = doc.body.innerHTML;
  return templateData;
}

export default { buildHTML };

function hasRequire() {
  return typeof require === "function" && !("IS_DESKTOP_APP" in globalThis);
}
