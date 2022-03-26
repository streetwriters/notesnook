const rangy = require("rangy/lib/rangy-textrange");

function getCharacterRange(node) {
  if (!node) return;
  const ranges = rangy.getSelection(getWindow()).saveCharacterRanges(node);
  if (!ranges || !ranges.length) return;
  const { characterRange } = ranges[0];
  return characterRange;
}

function getNextCharacter(node, range) {
  if (!range) return "";
  return (node.textContent || node.innerText).substring(
    range.end,
    range.end + 1
  );
}

function getPreviousCharacter(node, range) {
  if (!range) return "";
  return (node.textContent || node.innerText).substring(
    range.start,
    range.start - 1
  );
}

function moveCaretTo(node, index, endIndex) {
  const newCharacterRange = {
    characterRange: {
      start: index,
      end: endIndex || index,
    },
  };

  rangy
    .getSelection(getWindow())
    .restoreCharacterRanges(node, [newCharacterRange]);
}

function getCurrentLine(node) {
  const lines = getLines(node);
  const index = getCurrentLineIndex(node);
  return lines[index];
}

function getPreviousLine(node) {
  const lines = getLines(node);
  const index = getCurrentLineIndex(node);
  if (index === 0) return "";
  return lines[index - 1];
}

function getCurrentLineIndex(node) {
  const lines = getLines(node);
  const characterRange = getCharacterRange(node);

  let prevLength = 0;
  let index = 0;
  for (let line of lines) {
    let length = prevLength + line.length + 1;

    if (characterRange.start >= prevLength && characterRange.end <= length)
      break;

    prevLength += line.length + 1;
    ++index;
  }
  return index;
}

function getLines(node) {
  const lines = node.innerText.split("\n");
  return lines;
}

function persistSelection(node, action) {
  try {
    let saved = rangy.getSelection(getWindow()).saveCharacterRanges(node);
    action();
    rangy.getSelection(getWindow()).restoreCharacterRanges(node, saved);
  } catch (e) {
    console.error(e);
  }
}

function addPluginToPluginManager(name, register) {
  // tinymce puts itself in the global namespace
  if (!globalThis.tinymce)
    throw new Error(
      `Please import tinymce before importing the ${name} plugin.`
    );

  globalThis.tinymce.PluginManager.add(name, register);
}

function getWindow() {
  return globalThis.tinymce.activeEditor.contentWindow;
}

function notifyEditorChange(editor, type) {
  setTimeout(() => {
    editor.fire("input", { inputType: type, data: "" });
  }, 0);
}

module.exports = {
  getCurrentLine,
  getPreviousLine,
  getCharacterRange,
  moveCaretTo,
  persistSelection,
  getNextCharacter,
  getPreviousCharacter,
  addPluginToPluginManager,
  notifyEditorChange,
};
