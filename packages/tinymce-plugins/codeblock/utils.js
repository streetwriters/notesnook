const TAGNAME = "PRE";
const state = {
  activeBlock: null,
  languages: [],
};
function createCodeBlock(content) {
  const pre = document.createElement(TAGNAME);
  pre.spellcheck = false;
  pre.classList.add("hljs");
  pre.innerHTML = newlineToBR(content);
  return pre;
}

function isCodeBlock(node) {
  return node.closest(TAGNAME);
}

function newlineToBR(html) {
  return html.replace(/\n/gm, "<br>");
}

module.exports = {
  newlineToBR,
  createCodeBlock,
  isCodeBlock,
  TAGNAME,
  state,
};
