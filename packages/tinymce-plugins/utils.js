const rangy = require("rangy/lib/rangy-textrange");

function getCharacterRange(node) {
  if (!node) return;
  const ranges = rangy.getSelection().saveCharacterRanges(node);
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

  rangy.getSelection().restoreCharacterRanges(node, [newCharacterRange]);
}

function getCurrentLine(node) {
  const characterRange = getCharacterRange(node);
  const lines = node.innerText.split("\n");

  let currentLine = "";
  let prevLength = 0;
  for (let line of lines) {
    let length = prevLength + line.length + 1;

    if (characterRange.start >= prevLength && characterRange.end <= length) {
      currentLine = line;
      break;
    }
    prevLength += line.length + 1;
  }
  return currentLine;
}

function persistSelection(node, action) {
  let saved = rangy.getSelection().saveCharacterRanges(node);
  action();
  rangy.getSelection().restoreCharacterRanges(node, saved);
}

function addPluginToPluginManager(name, register) {
  // tinymce puts itself in the global namespace
  if (!global.tinymce)
    throw new Error(
      `Please import tinymce before importing the ${name} plugin.`
    );

  global.tinymce.PluginManager.add(name, register);
}

module.exports = {
  getCurrentLine,
  getCharacterRange,
  moveCaretTo,
  persistSelection,
  getNextCharacter,
  getPreviousCharacter,
  addPluginToPluginManager,
};
