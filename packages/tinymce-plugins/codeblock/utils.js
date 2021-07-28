const TAGNAME = "PRE";
const state = {
  activeBlock: null,
  languages: [{ type: "choiceitem", text: "Auto detect", value: "autodetect" }],
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
