import "./focus.css";

class Focus {
  constructor(quill, options) {
    this.quill = quill;
    this.options = options;
    this.container = quill.container;
    this.focusClass = options.focusClass || "focused-blot";
    if (options.enabled) {
      this.toggle(true);
    }
  }

  onSelectionChanged = (range) => {
    this.highlightBlot(range);
  };

  onTextChanged = () => {
    const selection = this.quill.getSelection();
    this.highlightBlot(selection);
  };

  toggle(enabled) {
    if (enabled) {
      this.quill.container.classList.add("quill-focus");
      this.removeHighlighting();
      this.quill.on("selection-change", this.onSelectionChanged);
      this.quill.on("text-change", this.onTextChanged);
    } else {
      this.removeHighlighting();
      this.quill.container.classList.remove("quill-focus");
      this.quill.off("selection-change", this.onSelectionChanged);
      this.quill.off("text-change", this.onTextChanged);
    }
  }

  removeHighlighting = () => {
    this.container.querySelectorAll("." + this.focusClass).forEach((blot) => {
      if (blot && blot.classList) {
        blot.classList.remove(this.focusClass);
      }
    });
  };

  highlightBlot = (range) => {
    this.removeHighlighting();
    if (range && range.index !== undefined) {
      var [line] = this.quill.getLine(range.index);
      if (line && line.domNode) {
        line.domNode.classList.add(this.focusClass);
        this.recursiveWalkUpward(line.domNode, (parent) => {
          parent.classList.add(this.focusClass);
        });
      }
    }
  };

  recursiveWalkUpward(domNode, cb) {
    var parent = domNode.parentNode;
    while (!parent.classList.contains("ql-editor")) {
      cb(parent);
      parent = parent.parentNode;
    }
  }
}

export default Focus;
