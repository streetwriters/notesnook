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
  _makeHeaderAction(headerSize) {
    return (text, selection, _pattern, lineStart) => {
      const [prevLine] = this.quill.getLine(lineStart - 1);
      const prevLineStart =
        selection.index - text.length - prevLine.cache.length;
      const prevLineText = this.quill.getText(
        prevLineStart,
        prevLine.cache.length
      );
      if (prevLineText.trim().length <= 0) return false;
      setTimeout(() => {
        this.quill.formatLine(prevLineStart, 0, "header", headerSize);
        this.quill.deleteText(lineStart, text.length);
      }, 0);
    };
  }
  _makeInlineAction(inlineStyle) {
    return (text, _selection, pattern, lineStart, commit, trigger) => {
      const matchInfo = matchInline(text, pattern, lineStart, commit);
      if (!matchInfo) return;
      const { matchedText, annotatedText, startIndex } = matchInfo;

      setTimeout(() => {
        this.quill.deleteText(startIndex, annotatedText.trim().length);
        this.quill.insertText(startIndex, matchedText, inlineStyle);
      }, 0);
    };
  }
  _makeEmphasisMatcher(name, numberOfChars, inlineStyle) {
    return {
      name,
      pattern: new RegExp(
        `(?:^|\\s|\\n|[^A-z0-9_*~\`])(\\*{${numberOfChars}}|_{${numberOfChars}})((?!\\1).*?)(\\1)($|\\s|\\n|[^A-z0-9_*~\`])`,
        "g"
      ),
      action: this._makeInlineAction(inlineStyle),
    };
  }

  constructor(quill, options) {
    this.quill = quill;
    this.options = options;

    this.ignoreTags = ["PRE"];
    this.matches = [
      this._makeEmphasisMatcher("bolditalic", 3, { bold: true, italic: true }),
      this._makeEmphasisMatcher("bold", 2, { bold: true }),
      this._makeEmphasisMatcher("italic", 1, { italic: true }),
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
        name: "subtext-header-1",
        pattern: /^=+$/g,
        action: this._makeHeaderAction(1),
      },
      {
        name: "subtext-header-2",
        pattern: /^-+$/g,
        action: this._makeHeaderAction(2),
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
        pattern: /^`{3}(\s+|)$/g,
        action: (text, selection, _pattern, lineStart, commit, trigger) => {
          if (!commit) return;
          // Need to defer this action https://github.com/quilljs/quill/issues/1134
          setTimeout(() => {
            this.quill.formatLine(selection.index, 1, "code-block", true);
            let deleteCount = trigger === " " ? 4 : 3;
            this.quill.deleteText(selection.index - deleteCount, deleteCount);
            this.quill.setSelection(selection.index - deleteCount);
          }, 0);
        },
      },
      {
        name: "strikethrough",
        pattern: /(?:^|\s|\n|[^A-z0-9_*~`])(~{2})((?!\1).*?)(\1)($|\s|\n|[^A-z0-9_*~`])/g,
        action: this._makeInlineAction({ strike: true }),
      },
      // {
      //   name: "displayformula",
      //   pattern: /(?:\$\$)(.+?)(?:\$\$)/g,
      //   action: (text, selection, pattern, lineStart) => {
      //     let match = pattern.exec(text);

      //     const annotatedText = match[0];
      //     const matchedText = match[1];
      //     const startIndex = lineStart + match.index;

      //     if (text.match(/^([*_ \n]+)$/g)) return;

      //     setTimeout(() => {
      //       this.quill.deleteText(startIndex, annotatedText.length);
      //       this.quill.insertEmbed(startIndex, "formula", matchedText);
      //       this.quill.insertText(startIndex + 1, "\n", "align", "center");
      //     }, 0);
      //   },
      // },
      // {
      //   name: "formula",
      //   pattern: /(?:\$)(.+?)(?:\$)/g,
      //   action: (text, selection, pattern, lineStart) => {
      //     let match = pattern.exec(text);

      //     const annotatedText = match[0];
      //     const matchedText = match[1];
      //     const startIndex = lineStart + match.index;

      //     if (text.match(/^([*_ \n]+)$/g)) return;

      //     setTimeout(() => {
      //       this.quill.deleteText(startIndex, annotatedText.length);
      //       this.quill.insertEmbed(startIndex, "formula", matchedText);
      //     }, 0);
      //   },
      // },
      {
        name: "code",
        pattern: /(?:^|\s|\n|[^A-z0-9_*~`])(`)((?!\1).*?)(\1)($|\s|\n|[^A-z0-9_*~`])/g,
        action: this._makeInlineAction({
          code: true,
        }),
      },
      {
        name: "hr",
        pattern: /^(-|\*){3}/g,
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
        pattern: /!\[([^\]]*)]\(([^)"]+)(?: "([^"]+)")?\)/g,
        action: (text, selection, pattern, _lineStart, commit, trigger) => {
          if (!commit) return;
          const [matchedText, , link] = pattern.exec(text);
          const start =
            selection.index - matchedText.length - (trigger === " " ? 1 : 0);
          setTimeout(() => {
            this.quill.deleteText(start, matchedText.length);
            this.quill.insertEmbed(start, "image", link);
          }, 0);
        },
      },
      {
        name: "link",
        pattern: /\[([^\]]+)]\(([^)"]+)(?: "([^"]+)")?\)/g,
        action: (text, selection, pattern, _lineStart, commit, trigger) => {
          if (!commit) return;
          const [matchedText, title, link] = pattern.exec(text);
          const start =
            selection.index - matchedText.length - (trigger === " " ? 1 : 0);
          setTimeout(() => {
            this.quill.deleteText(start, matchedText.length);
            this.quill.insertText(start, title, "link", link);
          }, 0);
        },
      },
    ];

    // Handler that looks for insert deltas that match specific characters
    this.quill.on("text-change", (delta, oldContents, source) => {
      if (source !== "user") return;
      for (let i = 0; i < delta.ops.length; i++) {
        if (delta.ops[i].hasOwnProperty("insert")) {
          let char = delta.ops[i].insert;
          if (char === " " || char === "\n") {
            this.onSpace(char, true);
          } //else this.onSpace("", false);
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

  onSpace(trigger, commit) {
    const selection = this.quill.getSelection();
    if (!selection) return;
    const [line, offset] = this.quill.getLine(selection.index);
    const lineStart = selection.index - offset;
    //const rawText = this.quill.getText(lineStart, selection.index - lineStart);

    // formulas count as a single character for insertion/deletion
    // purposes, yet they don't show up the output of getText.
    // So we have to compensate:
    // see https://github.com/quilljs/quill/blob/cb0fb6630a59aa8efff3e0d1caa6645e565d19bd/core/editor.js#L147
    // for the implementation of getText, which is what we were using before here
    const text = this.quill
      .getContents(lineStart, selection.index)
      .filter((op) => typeof op.insert === "string" /* || op.insert.formula*/)
      .map((op) => op.insert /*(op.insert.formula ? " " : op.insert) */)
      .join("");

    if (this.isValid(text, line.domNode.tagName)) {
      for (let match of this.matches) {
        const matchedText = text.match(match.pattern);
        if (matchedText) {
          // We need to replace only matched text not the whole line
          if (
            match.action(
              text,
              selection,
              match.pattern,
              lineStart,
              commit,
              trigger
            ) !== false
          ) {
            this.lastMatch = match;
            console.log("Quill match made (" + match.name + ")");
            return;
          }
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
}

if (window.Quill) {
  window.Quill.register("modules/markdownShortcuts", MarkdownShortcuts);
}

export default MarkdownShortcuts;
