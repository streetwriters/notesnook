// Quill.js Plugin - Markdown Shortcuts
// This is a module for the Quill.js WYSIWYG editor (https://quilljs.com/)
// which converts text entered as markdown to rich text.
//
// v0.0.5
//
// Author: Patrick Lee (me@patricklee.nyc)
//
// (c) Copyright 2017 Patrick Lee (me@patricklee.nyc).
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE.
//
import Quill from "quill";
import HorizontalRule from "./hr";

const Block = Quill.import("blots/block");
Quill.register("formats/horizontal", HorizontalRule);

function matchInline(text, pattern, lineStart, commit) {
  if (text.match(/^([*_ \n]+)$/g)) return false;

  let match = pattern.exec(text);

  const annotatedText = match[0];
  const matchedText = match[2];
  match.index = match.index && commit ? match.index + 1 : match.index;
  const startIndex = lineStart + match.index;

  return { annotatedText, matchedText, startIndex };
}
class MarkdownShortcuts {
  _makeEmphasisMatcher(name, numberOfChars, bold, italic) {
    return {
      name,
      pattern: new RegExp(
        `(?:^|\\s|\\n|[^A-z0-9_*~\`])(\\*{${numberOfChars}}|_{${numberOfChars}})((?!\\1).*?)(\\1)($|\\s|\\n|[^A-z0-9_*~\`])`,
        "g"
      ),
      action: (text, _selection, pattern, lineStart, commit) => {
        const matchInfo = matchInline(text, pattern, lineStart, commit);
        if (!matchInfo) return;
        const { matchedText, annotatedText, startIndex } = matchInfo;

        setTimeout(() => {
          this.quill.deleteText(startIndex, annotatedText.length);
          this.quill.insertText(
            startIndex,
            commit ? matchedText + " " : annotatedText,
            {
              bold,
              italic,
            }
          );
          this.quill.format("bold", false);
          this.quill.format("italic", false);
        }, 0);
      },
    };
  }

  constructor(quill, options) {
    this.quill = quill;
    this.options = options;

    this.ignoreTags = ["PRE"];
    this.matches = [
      this._makeEmphasisMatcher("bolditalic", 3, true, true),
      this._makeEmphasisMatcher("bold", 2, true, false),
      this._makeEmphasisMatcher("italic", 1, false, true),
      {
        name: "header",
        pattern: /^(#){1,6}\s/g,
        action: (text, selection, pattern) => {
          var match = pattern.exec(text);
          if (!match) return;
          const size = match[0].length;
          // Need to defer this action https://github.com/quilljs/quill/issues/1134
          setTimeout(() => {
            this.quill.formatLine(selection.index, 0, "header", size - 1);
            this.quill.deleteText(selection.index - size, size);
          }, 0);
        },
      },
      {
        name: "blockquote",
        pattern: /^(>)\s/g,
        action: (text, selection) => {
          // Need to defer this action https://github.com/quilljs/quill/issues/1134
          setTimeout(() => {
            this.quill.formatLine(selection.index, 1, "blockquote", true);
            this.quill.deleteText(selection.index - 2, 2);
          }, 0);
        },
      },
      {
        name: "code-block",
        pattern: /^`{3}(?:\s|\n)/g,
        action: (text, selection) => {
          // Need to defer this action https://github.com/quilljs/quill/issues/1134
          setTimeout(() => {
            this.quill.formatLine(selection.index, 1, "code-block", true);
            this.quill.deleteText(selection.index - 4, 4);
          }, 0);
        },
      },
      {
        name: "strikethrough",
        pattern: /(?:^|\s|\n|[^A-z0-9_*~`])(~{2})((?!\1).*?)(\1)($|\s|\n|[^A-z0-9_*~`])/g,
        action: (text, _selection, pattern, lineStart, commit) => {
          const matchInfo = matchInline(text, pattern, lineStart, commit);
          if (!matchInfo) return;
          const { matchedText, annotatedText, startIndex } = matchInfo;

          setTimeout(() => {
            this.quill.deleteText(startIndex, annotatedText.length);
            this.quill.insertText(
              startIndex,
              commit ? matchedText : annotatedText,
              { strike: true }
            );
            this.quill.format("strike", false);
          }, 0);
        },
      },
      {
        name: "displayformula",
        pattern: /(?:\$\$)(.+?)(?:\$\$)/g,
        action: (text, selection, pattern, lineStart) => {
          let match = pattern.exec(text);

          const annotatedText = match[0];
          const matchedText = match[1];
          const startIndex = lineStart + match.index;

          if (text.match(/^([*_ \n]+)$/g)) return;

          setTimeout(() => {
            this.quill.deleteText(startIndex, annotatedText.length);
            this.quill.insertEmbed(startIndex, "formula", matchedText);
            this.quill.insertText(startIndex + 1, "\n", "align", "center");
          }, 0);
        },
      },
      {
        name: "formula",
        pattern: /(?:\$)(.+?)(?:\$)/g,
        action: (text, selection, pattern, lineStart) => {
          let match = pattern.exec(text);

          const annotatedText = match[0];
          const matchedText = match[1];
          const startIndex = lineStart + match.index;

          if (text.match(/^([*_ \n]+)$/g)) return;

          setTimeout(() => {
            this.quill.deleteText(startIndex, annotatedText.length);
            this.quill.insertEmbed(startIndex, "formula", matchedText);
          }, 0);
        },
      },
      {
        name: "code",
        pattern: /(?:^|\s|\n|[^A-z0-9_*~`])(`)((?!\1).*?)(\1)($|\s|\n|[^A-z0-9_*~`])/g,
        action: (text, _selection, pattern, lineStart, commit) => {
          const matchInfo = matchInline(text, pattern, lineStart, commit);
          if (!matchInfo) return;
          const { matchedText, annotatedText, startIndex } = matchInfo;

          setTimeout(() => {
            this.quill.deleteText(startIndex, annotatedText.length);
            if (!commit) this.quill.insertText(startIndex, " ");
            this.quill.insertText(
              startIndex + (commit ? 0 : 1),
              commit ? matchedText : annotatedText.trim(),
              { code: true }
            );
            this.quill.format("code", false);
            if (commit) this.quill.insertText(this.quill.getSelection(), " ");
          }, 0);
        },
      },
      {
        name: "hr",
        pattern: /^(-\s?){3}/g,
        action: (text, selection, pattern) => {
          setTimeout(() => {
            const matchedText = text.match(pattern)[0];
            const startIndex = selection.index - matchedText.length;
            this.quill.deleteText(startIndex, matchedText.length);

            this.quill.insertEmbed(startIndex, "hr", true, Quill.sources.USER);
            this.quill.setSelection(startIndex + 1, Quill.sources.SILENT);
          }, 0);
        },
      },
      {
        name: "plus-ul",
        // Quill 1.3.5 already treat * as another trigger for bullet lists
        pattern: /^\+\s$/g,
        action: (text, selection, pattern) => {
          setTimeout(() => {
            this.quill.formatLine(selection.index, 1, "list", "unordered");
            this.quill.deleteText(selection.index - 2, 2);
          }, 0);
        },
      },
      {
        name: "image",
        pattern: /(?:!\[(.+?)\])(?:\((.+?)\))/g,
        action: (text, selection, pattern) => {
          const startIndex = text.search(pattern);
          const matchedText = text.match(pattern)[0];
          // const hrefText = text.match(/(?:!\[(.*?)\])/g)[0]
          const hrefLink = text.match(/(?:\((.*?)\))/g)[0];
          const start = selection.index - matchedText.length - 1;
          if (startIndex !== -1) {
            setTimeout(() => {
              this.quill.deleteText(start, matchedText.length);
              this.quill.insertEmbed(
                start,
                "image",
                hrefLink.slice(1, hrefLink.length - 1)
              );
            }, 0);
          }
        },
      },
      {
        name: "link",
        pattern: /(?:\[(.+?)\])(?:\((.+?)\))/g,
        action: (text, selection, pattern) => {
          const startIndex = text.search(pattern);
          const matchedText = text.match(pattern)[0];
          const hrefText = text.match(/(?:\[(.*?)\])/g)[0];
          const hrefLink = text.match(/(?:\((.*?)\))/g)[0];
          const start = selection.index - matchedText.length - 1;
          if (startIndex !== -1) {
            setTimeout(() => {
              this.quill.deleteText(start, matchedText.length);
              this.quill.insertText(
                start,
                hrefText.slice(1, hrefText.length - 1),
                "link",
                hrefLink.slice(1, hrefLink.length - 1)
              );
            }, 0);
          }
        },
      },
    ];

    // Handler that looks for insert deltas that match specific characters
    this.quill.on("text-change", (delta, oldContents, source) => {
      if (source !== "user") return;
      for (let i = 0; i < delta.ops.length; i++) {
        if (delta.ops[i].hasOwnProperty("insert")) {
          if (delta.ops[i].insert === " ") {
            this.onSpace(true);
          } else if (delta.ops[i].insert === "\n") {
            this.onEnter();
          } else this.onSpace(false);
        } else if (delta.ops[i].hasOwnProperty("delete") && source === "user") {
          this.onDelete();
        }
      }
    });
  }

  isValid(text, tagName) {
    return (
      typeof text !== "undefined" &&
      text &&
      this.ignoreTags.indexOf(tagName) === -1
    );
  }

  onSpace(commit) {
    const selection = this.quill.getSelection();
    if (!selection) return;
    const [line, offset] = this.quill.getLine(selection.index);
    const lineStart = selection.index - offset;
    const rawText = this.quill.getText(lineStart, selection.index - lineStart);

    // formulas count as a single character for insertion/deletion
    // purposes, yet they don't show up the output of getText.
    // So we have to compensate:
    const delta = this.quill.getContents(lineStart, selection.index);
    const numFormulas = delta.ops.filter((op) => op.insert && op.insert.formula)
      .length;
    const text = " ".repeat(numFormulas) + rawText;
    if (this.isValid(text, line.domNode.tagName)) {
      for (let match of this.matches) {
        const matchedText = text.match(match.pattern);
        if (matchedText) {
          // We need to replace only matched text not the whole line
          match.action(text, selection, match.pattern, lineStart, commit);
          this.lastMatch = match;
          console.log("Quill match made (" + match.name + ")");
          return;
        }
      }
    }
  }

  onDelete() {
    const range = this.quill.getSelection();
    const format = this.quill.getFormat(range);

    if (format.blockquote || format.code || format["code-block"]) {
      if (this.isLastBrElement(range) || this.isEmptyLine(range)) {
        this.quill.removeFormat(range.index, range.length);
      }
    }
  }

  isLastBrElement(range) {
    const [block] = this.quill.scroll.descendant(Block, range.index);
    const isBrElement =
      block != null && block.domNode.firstChild instanceof HTMLBRElement;
    return isBrElement;
  }

  isEmptyLine(range) {
    const [line] = this.quill.getLine(range.index);
    const isEmpty = line?.children?.head?.text?.trim() === "";
    return isEmpty;
  }

  onEnter() {
    let selection = this.quill.getSelection();
    if (!selection) return;
    const [line, offset] = this.quill.getLine(selection.index);
    const text = line.domNode.textContent + " ";
    const lineStart = selection.index - offset;
    selection.length = selection.index++;
    if (this.isValid(text, line.domNode.tagName)) {
      for (let match of this.matches) {
        const matchedText = text.match(match.pattern);
        if (matchedText) {
          match.action(text, selection, match.pattern, lineStart, true);
          return;
        }
      }
    }
  }
}

if (window.Quill) {
  window.Quill.register("modules/markdownShortcuts", MarkdownShortcuts);
}

export default MarkdownShortcuts;
