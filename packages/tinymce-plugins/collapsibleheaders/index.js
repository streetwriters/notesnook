const { addPluginToPluginManager } = require("../utils");

const COLLAPSED_KEY = "c";
const HIDDEN_KEY = "h";
const collapsibleTags = { HR: 1, H2: 2, H3: 3, H4: 4, H5: 5 };

function register(editor) {
  editor.on("mousedown touchstart", function (e) {
    const { target } = e;
    if (
      e.offsetX < 0 &&
      collapsibleTags[target.tagName] &&
      target.parentElement.tagName === "DIV"
    ) {
      e.preventDefault();
      e.stopImmediatePropagation();
      e.stopPropagation();
      editor.undoManager.transact(() => {
        if (target.classList.contains(COLLAPSED_KEY)) {
          target.classList.remove(COLLAPSED_KEY);
        } else {
          target.classList.add(COLLAPSED_KEY);
        }
        collapseElement(target);
      });
    }
  });

  editor.on("NewBlock", function (event) {
    const { newBlock } = event;
    const target = newBlock?.previousElementSibling;
    if (target?.classList.contains(COLLAPSED_KEY)) {
      target.classList.remove(COLLAPSED_KEY);
      collapseElement(target);
    }
  });
}

function toggleElementVisibility(element, toggleState) {
  if (!toggleState) element.classList.remove(HIDDEN_KEY);
  else element.classList.add(HIDDEN_KEY);
}

function collapseElement(target) {
  let sibling = target.nextSibling;
  const isTargetCollapsed = target.classList.contains(COLLAPSED_KEY);
  let skip = false;

  while (
    sibling &&
    (!collapsibleTags[sibling.tagName] ||
      collapsibleTags[sibling.tagName] > collapsibleTags[target.tagName])
  ) {
    const isCollapsed = sibling.classList.contains(COLLAPSED_KEY);
    if (!isTargetCollapsed) {
      if (isCollapsed) {
        skip = true;
        toggleElementVisibility(sibling, isTargetCollapsed);
      } else if (skip && collapsibleTags[sibling.tagName]) {
        skip = false;
      }
    }
    if (!skip) {
      toggleElementVisibility(sibling, isTargetCollapsed);
    }
    if (!sibling.nextSibling) break;
    sibling = sibling.nextSibling;
  }
}

(function init() {
  addPluginToPluginManager("collapsibleheaders", register);
})();
