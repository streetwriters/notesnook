const {
  getCharacterRange,
  getNextCharacter,
  getPreviousCharacter,
  moveCaretTo,
  addPluginToPluginManager,
} = require("../utils");

const WRAP_CHARS = {
  '"': { start: '"', end: '"' },
  "[": { start: "[", end: "]" },
  "(": { start: "(", end: ")" },
  "{": { start: "{", end: "}" },
  "|": { start: "|", end: "|" },
  "`": { start: "`", end: "`" },
};

function register(editor) {
  editor.on("keydown", function (e) {
    const content = editor.selection.getContent();
    const node = editor.selection.getNode();
    if (node?.nodeName === "PRE") return;

    if (content) {
      if (e.key === "`") {
        e.preventDefault();
        // dependent upon inline code plugin.
        editor.execCommand("mceInsertInlineCode");
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
}

(function init() {
  addPluginToPluginManager("shortcuts", register);
})();
