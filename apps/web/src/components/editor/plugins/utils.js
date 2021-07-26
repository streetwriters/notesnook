import rangy from "rangy/lib/rangy-textrange";

export function getCharacterRange(node) {
  if (!node) return;
  const ranges = rangy.getSelection().saveCharacterRanges(node);
  if (!ranges || !ranges.length) return;
  const { characterRange } = ranges[0];
  return characterRange;
}

export function getNextCharacter(node, range) {
  if (!range) return "";
  return (node.textContent || node.innerText).substring(
    range.end,
    range.end + 1
  );
}

export function getPreviousCharacter(node, range) {
  if (!range) return "";
  return (node.textContent || node.innerText).substring(
    range.start,
    range.start - 1
  );
}

export function moveCaretTo(node, index, endIndex) {
  const newCharacterRange = {
    characterRange: {
      start: index,
      end: endIndex || index,
    },
  };

  rangy.getSelection().restoreCharacterRanges(node, [newCharacterRange]);
}

export function persistSelection(node, action) {
  let saved = rangy.getSelection().saveCharacterRanges(node);
  action();
  rangy.getSelection().restoreCharacterRanges(node, saved);
}
