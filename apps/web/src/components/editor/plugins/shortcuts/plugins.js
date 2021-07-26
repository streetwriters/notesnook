import tinymce from "tinymce/tinymce";
import { getCharacterRange, moveCaretTo } from "../utils";

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
      } else if (!!WRAP_CHARS[e.key]) {
        e.preventDefault();
        const char = WRAP_CHARS[e.key];

        editor.selection.setContent(`${char.start}${char.end}`);

        const characterRange = getCharacterRange(node);
        moveCaretTo(node, characterRange.start - 1, characterRange.end - 1);
      }
    });
  });
})();
