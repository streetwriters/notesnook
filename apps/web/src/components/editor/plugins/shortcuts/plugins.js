import tinymce from "tinymce/tinymce";
import {
  getCharacterRange,
  getNextCharacter,
  getPreviousCharacter,
  moveCaretTo,
} from "../utils";

const WRAP_CHARS = {
  '"': { start: '"', end: '"' },
  "[": { start: "[", end: "]" },
  "(": { start: "(", end: ")" },
  "{": { start: "{", end: "}" },
  "|": { start: "|", end: "|" },
  "`": { start: "`", end: "`" },
};

(function () {
  tinymce.PluginManager.add("shortcuts", function (editor, url) {
    editor.on("keydown", function (e) {
      const content = editor.selection.getContent();
      const node = editor.selection.getNode();
      if (node?.nodeName === "PRE") return;

      if (content) {
        if (e.key === "`") {
          e.preventDefault();
          editor.execCommand("mceCode");
        } else if (!!WRAP_CHARS[e.key]) {
          e.preventDefault();
          const char = WRAP_CHARS[e.key];
          editor.selection.setContent(`${char.start}${content}${char.end}`);
        }
      } else if (e.code === "Backspace") {
        const characterRange = getCharacterRange(node);
        const nextChar = getNextCharacter(node, characterRange);
        const prevChar = getPreviousCharacter(node, characterRange);
        const isWrapChar = !!WRAP_CHARS[nextChar];
        if (isWrapChar && nextChar === prevChar) {
          e.preventDefault();
          editor.execCommand("ForwardDelete");
          editor.execCommand("Delete");
        }
      } else if (!!WRAP_CHARS[e.key]) {
        e.preventDefault();
        const char = WRAP_CHARS[e.key];
        const characterRange = getCharacterRange(node);
        const nextChar = getNextCharacter(node, characterRange);
        const prevChar = getPreviousCharacter(node, characterRange);

        if (nextChar === e.key) {
          moveCaretTo(node, characterRange.start + 1, characterRange.end + 1);
        } else if (!prevChar.trim()) {
          editor.selection.setContent(`${char.start}${char.end}`);
          characterRange.start += char.start.length + char.end.length;
          characterRange.end += char.start.length + char.end.length;
          moveCaretTo(node, characterRange.start - 1, characterRange.end - 1);
        } else {
          editor.selection.setContent(`${e.key}`);
        }
      }
    });
  });
})();
