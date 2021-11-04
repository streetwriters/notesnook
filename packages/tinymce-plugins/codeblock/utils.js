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
  return node.nodeName === TAGNAME;
}

function isInsideCodeBlock(element) {
  let elem = element;
  while (elem.tagName !== TAGNAME && !!elem.parentElement) {
    elem = elem.parentElement;
    if (elem.classList.contains("mce-content-body")) {
      elem = undefined;
      break;
    }
  }
  return elem && elem.tagName === TAGNAME;
}

function newlineToBR(html) {
  return html.replace(/\n/gm, "<br>");
}

module.exports = {
  newlineToBR,
  isInsideCodeBlock,
  createCodeBlock,
  isCodeBlock,
  TAGNAME,
  state,
};
