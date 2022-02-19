const { addPluginToPluginManager, notifyEditorChange } = require("../utils");

const CLASS_NAMES = {
  list: "checklist",
  checked: "checked",
};

const EMPTY_CHECKLIST_HTML = `<ul class="${CLASS_NAMES.list}"><li></li></ul>`;

/**
 * @param {import("tinymce").Editor} editor
 */
function register(editor) {
  editor.addCommand("insertChecklist", function(_api, value) {
    insertChecklist(editor, value && value.checked);
  });

  editor.ui.registry.addToggleButton("checklist", {
    icon: "checklist",
    active: false,
    tooltip: "Checklist",
    onAction: () => insertChecklist(editor),
    onSetup: function(api) {
      return listState(editor, api.setActive);
    },
  });

  editor.on(
    "mousedown",
    function(event) {
      var node = event.target;
      var parent = node.parentElement;

      if (
        event.offsetX > 0 ||
        parent.className !== CLASS_NAMES.list ||
        node.nodeName !== "LI"
      ) {
        return;
      }
      event.preventDefault();
      toggleChecklistItem(editor, node);
    },
    { capture: true, passive: false }
  );

  let shouldCancelNextTouchEndEvent = false;
  const onTouchStartEnd = function(event) {
    if (event.type === "touchend") {
      if (shouldCancelNextTouchEndEvent) {
        event.preventDefault();
        shouldCancelNextTouchEndEvent = false;
      }
      return;
    }

    if (event.targetTouches.length !== 1) return;

    let xPos = event.targetTouches[0].clientX;

    if (xPos > 55) return;

    let node = event.target;
    let parent = node.parentElement;

    if (node.nodeName !== "LI") {
      let yPos = event.targetTouches[0].clientY;
      let elements = editor.dom.doc.elementsFromPoint(55, yPos);

      if (!elements || elements.length === 0) return;
      node = elements[0];
      parent = node.parentElement;
    }

    if (
      node.nodeName === "LI" &&
      parent &&
      parent.className === CLASS_NAMES.list
    ) {
      shouldCancelNextTouchEndEvent = true;
      event.preventDefault();
      toggleChecklistItem(editor, node);
    }
  };

  editor.on("touchstart touchend", onTouchStartEnd, {
    capture: true,
    passive: false,
  });
}

/**
 * @param {import("tinymce").Editor} editor
 * @param {boolean} checked
 */
function insertChecklist(editor, checked = false) {
  const node = editor.selection.getNode();
  if (node.classList.contains(CLASS_NAMES.list)) {
    editor.undoManager.transact(function() {
      editor.execCommand("RemoveList");
    });
  } else {
    editor.execCommand("InsertUnorderedList", false, {
      "list-style-type": "none",
      "list-attributes": {
        class: CLASS_NAMES.list,
        "data-mce-flag": "temp",
      },
    });

    if (checked) {
      const checklist = editor
        .getDoc()
        .querySelector(`.${CLASS_NAMES.list}[data-mce-flag="temp"]`);
      if (!checklist) return;
      toggleChecklistItem(editor, checklist.lastElementChild);
      checklist.removeAttribute("data-mce-flag");
    }
  }
}

function listState(editor, activate) {
  var nodeChangeHandler = function(e) {
    var inList = findUntil(e.parents, isListNode, isTableCellNode);
    if (inList)
      inList =
        inList.filter(function(list) {
          return list.className === CLASS_NAMES.list;
        }).length > 0;
    activate(inList);
  };
  var parents = editor.dom.getParents(editor.selection.getNode());
  nodeChangeHandler({ parents: parents });
  editor.on("NodeChange", nodeChangeHandler);
  return function() {
    return editor.off("NodeChange", nodeChangeHandler);
  };
}

function findUntil(xs, pred, until) {
  for (var i = 0, len = xs.length; i < len; i++) {
    var x = xs[i];
    if (pred(x, i)) {
      return [x];
    } else if (until(x, i)) {
      break;
    }
  }
  return;
}

var isListNode = matchNodeNames(/^(OL|UL|DL)$/);
var isTableCellNode = matchNodeNames(/^(TH|TD)$/);
function matchNodeNames(regex) {
  return function(node) {
    return node && regex.test(node.nodeName);
  };
}

/**
 * @param {import("tinymce").Editor} editor
 * @param {HTMLElement} node
 */
function toggleChecklistItem(editor, node) {
  editor.undoManager.transact(function() {
    const isChecked = node.classList.contains(CLASS_NAMES.checked);
    if (isChecked) node.classList.remove(CLASS_NAMES.checked);
    else node.classList.add(CLASS_NAMES.checked);
    notifyEditorChange(editor, isChecked ? "checkItem" : "uncheckItem");
  });
}

(function init() {
  addPluginToPluginManager("checklist", register);
})();
