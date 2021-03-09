import tinymce from "tinymce/tinymce";

(function () {
  tinymce.PluginManager.add("checklist", function (editor, url) {
    /**
     * Plugin behaviour for when the Toolbar or Menu item is selected
     *
     * @private
     */
    function _onAction() {
      var content = `<ul class="tox-checklist"><li></li></ul>`;
      editor.undoManager.transact(function () {
        editor.insertContent(content);
      });
    }

    editor.addCommand("InsertCheckList", function (ui, value) {
      _onAction();
    });

    editor.ui.registry.addButton("checklist", {
      icon: "checklist",
      tooltip: "Insert check list",
      onAction: _onAction,
    });

    editor.on(
      "mousedown",
      function (event) {
        var node = event.target;
        var parent = node.parentElement;
        if (event.offsetX > 0 || parent.className !== "tox-checklist") {
          return;
        }
        //editor.selection.setRng(range_selection);

        editor.undoManager.transact(function () {
          event.preventDefault();
          if (parent.className === "tox-checklist") {
            if (
              node.nodeName === "LI" &&
              node.className === "tox-checklist--checked"
            ) {
              node.className = "";
            } else if (node.nodeName === "LI" && node.className === "") {
              node.className = "tox-checklist--checked";
            }
          }
        });

        //editor.fire("input",)
        //editor.selection.setRng(range_selection);
      },
      { capture: true, passive: false }
    );

    editor.on(
      "touchstart",
      function (event) {
        var node = event.target;
        var parent = node.parentElement;
        if (
          event.targetTouches.length > 0 ||
          event.targetTouches[0].clientX > 45 ||
          parent.className !== "tox-checklist"
        ) {
          return;
        }
        //editor.selection.setRng(range_selection);
        editor.undoManager.transact(function () {
          event.preventDefault();
          if (parent.className === "tox-checklist") {
            node.scrollIntoView(false);
            if (
              node.nodeName === "LI" &&
              node.className === "tox-checklist--checked"
            ) {
              node.className = "";
            } else if (node.nodeName === "LI" && node.className === "") {
              node.className = "tox-checklist--checked";
            }
          }
        });

        //editor.fire("input",)
        //editor.selection.setRng(range_selection);
      },
      { capture: true, passive: false }
    );

    editor.on("NodeChange", function (event) {
      var node = event.target;
      var parent = node?.parentElement;
      if (!parent) return;
      if (parent.className === "tox-checklist") {
        if (
          node.nodeName === "LI" &&
          node.className === "tox-checklist--checked"
        ) {
          node.className = "";
        }
      }
    });

    editor.on("NewBlock", function (event) {
      if (
        event.newBlock.nodeName === "LI" &&
        event.newBlock.className === "tox-checklist--checked"
      ) {
        event.newBlock.className = "";
      }
    });
  });
})();
