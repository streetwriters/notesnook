import React, { Component } from "react";
import Quill from "quill";
import "quill/dist/quill.snow.css";
import "quill/dist/quill.core.css";
import MarkdownShortcuts from "./modules/markdown";
import MagicUrl from "quill-magic-url";
import { Text } from "rebass";

Quill.register("modules/markdownShortcuts", MarkdownShortcuts);
Quill.register("modules/magicUrl", MagicUrl);

const List = Quill.import("formats/list");

class BetterList extends List {
  constructor(el) {
    super(el);

    const isCheckList = el.hasAttribute("data-checked");
    el.addEventListener("touchstart", (e) => {
      if (!isCheckList) {
        return;
      }
      e.preventDefault();
    });
  }
}

Quill.register("formats/lists", BetterList);

const quillModules = (isSimple) => ({
  toolbar: [
    //
    ["bold", "italic", "underline", "strike", "blockquote"],
    [{ header: "2" }, { header: "3" }, { header: [false, 4, 5, 6] }],
    [
      { align: "" },
      { align: "center" },
      { align: "right" },
      { align: "justify" },
    ],
    [
      { list: "ordered" },
      { list: "bullet" },
      { list: "check" },
      { indent: "-1" },
      { indent: "+1" },
    ],
    [{ size: ["small", false, "large", "huge"] }],
    ["code-block", { script: "sub" }, { script: "super" }],
    [{ color: [] }, { background: [] }],
    ["link", "image", "video"],
    [{ direction: "rtl" }, "clean"],
  ],
  // syntax: true,
  markdownShortcuts: {},
  magicUrl: true,
  history: { maxStack: 1000 * 5 },
});

export default class ReactQuill extends Component {
  /**
   * @type {Quill}
   */
  quill;
  changeTimeout;
  getEditor() {
    return this.quill.editor;
  }

  shouldComponentUpdate(nextProps) {
    return (
      this.props.readOnly !== nextProps.readOnly ||
      this.props.isSimple !== nextProps.isSimple
    );
  }

  componentDidMount() {
    const {
      placeholder,
      container,
      scrollContainer,
      readOnly,
      initialContent,
      onChange,
      onSave,
      modules,
      id,
      isSimple,
    } = this.props;
    this.quill = new Quill("#" + id, {
      placeholder,
      bounds: container,
      scrollingContainer: scrollContainer,
      modules: modules || quillModules(isSimple),
      theme: "snow",
      readOnly,
    });

    if (initialContent) {
      this.quill.setContents(initialContent);
    }

    if (onChange) {
      this.quill.on("text-change", this.textChangeHandler);
    }

    if (onSave) {
      this.quill.keyboard.addBinding(
        {
          key: "S",
          shortKey: true,
        },
        onSave.bind(this, this.quill)
      );
    }
  }

  componentWillUnmount() {
    if (!this.quill) return;
    this.quill.off("text-change", this.textChangeHandler);
  }

  textChangeHandler = (_delta, _oldDelta, source) => {
    this.props.onWordCountChanged(this.getWordCount());
    if (source === "init") return;
    clearTimeout(this.changeTimeout);
    this.changeTimeout = setTimeout(
      this.props.onChange,
      this.props.changeInterval
    );
  };

  getWordCount() {
    let text = this.quill.getText();
    return (text.split(/\b\S+\b/g) || []).length;
  }

  render() {
    return (
      <Text
        mx={[2, 2, 0]}
        as="pre"
        sx={{ cursor: "text" }}
        onClick={() => {
          this.quill.focus();
        }}
        onFocus={this.props.onFocus}
        id={this.props.id}
      />
    );
  }
}
