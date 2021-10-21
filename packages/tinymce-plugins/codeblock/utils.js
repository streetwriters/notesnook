const TAGNAME = "PRE";
const state = {
  activeBlock: null,
  languages: [],
};
function createCodeBlock(content) {
  const pre = document.createElement(TAGNAME);
  pre.spellcheck = false;
  pre.classList.add("hljs");
  pre.innerHTML = content;
  return pre;
}

function isCodeBlock(node) {
  return node.nodeName === TAGNAME;
}

module.exports = { createCodeBlock, isCodeBlock, TAGNAME, state };
