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
  let keydownEvent = null;
  let handled = false;

  editor.on("beforeinput", function (e) {
    if (handled) {
      handled = false;
      return;
    }

    if (e.inputType === "deleteContentBackward") {
      e.code = "Backspace";
      e.key = "Backspace";
    } else if (e.inputType.includes("insert")) {
      e.key = e.data;
      if (e.data && e.data.endsWith("\n")) {
        e.code = "Enter";
        e.key = "Enter";
      }
    }

    action(e, editor);

    if (!e.isDefaultPrevented && keydownEvent) {
      keydownEvent.noOverride = true;
      editor.fire("keydown", keydownEvent);
    }
  });

  editor.on("keydown", function (e) {
    if (e.key === "Unidentified" && !e.noOverride) {
      e.preventDefault();
      keydownEvent = e;
      return;
    }
    handled = true;
    action(e, editor);
  });
}

function action(e, editor) {
  const rng = editor.selection.getRng();
  const isTextSelected = rng.startOffset !== rng.endOffset;
  const content = editor.selection.getContent();
  const node = editor.selection.getNode();
  if (node && node.nodeName === "PRE") return;

  if (e.code === "Backspace") {
    const characterRange = getCharacterRange(node);
    const nextChar = getNextCharacter(node, characterRange);
    const prevChar = getPreviousCharacter(node, characterRange);

    const isWrapChar = !!WRAP_CHARS[nextChar];
    if (isWrapChar && nextChar === prevChar) {
      e.preventDefault();
      editor.execCommand("ForwardDelete");
      editor.execCommand("Delete");
    }
  } else if (isTextSelected) {
    if (e.key === "`") {
      e.preventDefault();
      // dependent upon inline code plugin.
      editor.execCommand("mceInsertInlineCode");
    } else if (!!WRAP_CHARS[e.key]) {
      e.preventDefault();
      const char = WRAP_CHARS[e.key];
      editor.selection.setContent(`${char.start}${content}${char.end}`);
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
}

(function init() {
  addPluginToPluginManager("shortcuts", register);
})();
