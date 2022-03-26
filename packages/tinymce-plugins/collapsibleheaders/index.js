const { addPluginToPluginManager, notifyEditorChange } = require("../utils");

const COLLAPSED_KEY = "c";
const HIDDEN_KEY = "h";
const collapsibleTags = { H1: 1, HR: 2, H2: 3, H3: 4, H4: 5, H5: 6, H6: 7 };

function register(editor) {
  let shouldCancelNextTouchEndEvent = false;
  editor.on(
    "mousedown touchstart",
    function(e) {
      const { target } = e;
      const isTouchDevice = e.targetTouches;
      let triggerOffset = 0;
      let offsetX;

      if (isTouchDevice) {
        if (e.targetTouches.length !== 1) return;
        triggerOffset = 15;
        offsetX = e.targetTouches[0].clientX;
      } else {
        offsetX = e.offsetX;
      }
      if (
        offsetX < triggerOffset &&
        collapsibleTags[target.tagName] &&
        (target.parentElement.tagName === "DIV" ||
          target.parentElement.tagName === "BODY")
      ) {
        shouldCancelNextTouchEndEvent = true;
        e.preventDefault();
        e.stopImmediatePropagation();
        e.stopPropagation();
        if (target.classList.contains(COLLAPSED_KEY)) {
          target.classList.remove(COLLAPSED_KEY);
        } else {
          target.classList.add(COLLAPSED_KEY);
        }
        collapseElement(target);
        notifyEditorChange(editor, "headingCollapsed");
      }
    },
    {
      capture: true,
      passive: false,
    }
  );

  editor.on(
    "touchend",
    (e) => {
      if (shouldCancelNextTouchEndEvent) {
        e.preventDefault();
        shouldCancelNextTouchEndEvent = false;
      }
    },
    {
      capture: true,
      passive: false,
    }
  );

  editor.on("NewBlock", function(event) {
    const { newBlock } = event;
    if (!newBlock) return;
    const target = newBlock.previousElementSibling;
    if (target && target.classList.contains(COLLAPSED_KEY)) {
      target.classList.remove(COLLAPSED_KEY);
      collapseElement(target);
      notifyEditorChange(editor, "headingCollapsed");
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
