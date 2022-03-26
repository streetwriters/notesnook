const TAGNAME = "PRE";
const state = {
  activeBlock: null,
  languages: [],
};
function createCodeBlock(content, language) {
  const pre = document.createElement(TAGNAME);
  pre.spellcheck = false;
  pre.classList.add("hljs");
  if (language) pre.classList.add(`language-${language}`);
  pre.innerHTML = newlineToBR(escapeHtml(content));
  return pre;
}

function isCodeBlock(node) {
  return node.closest(TAGNAME);
}

function newlineToBR(html) {
  return html.replace(/\n/gm, "<br>");
}

function escapeHtml(html) {
  var text = document.createTextNode(html);
  var p = document.createElement("p");
  p.appendChild(text);
  return p.innerHTML;
}

module.exports = {
  newlineToBR,
  createCodeBlock,
  isCodeBlock,
  TAGNAME,
  state,
};
