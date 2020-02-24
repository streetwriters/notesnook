import React, { Component } from "react";
import { Box } from "rebass";
import Quill from "quill";
import "quill/dist/quill.snow.css";
import MarkdownShortcuts from "./modules/markdown";
import MagicUrl from "quill-magic-url";

Quill.register("modules/markdownShortcuts", MarkdownShortcuts);
Quill.register("modules/magicUrl", MagicUrl);

const modules = {
  toolbar: [
    [{ header: [1, 2, 3, 4, 5, 6] }],
    ["bold", "italic", "underline", "strike", "blockquote"],
    [
      { align: "" },
      { align: "center" },
      { align: "right" },
      { align: "justify" }
    ],
    [
      { list: "ordered" },
      { list: "bullet" },
      { indent: "-1" },
      { indent: "+1" }
    ],
    [{ size: ["small", false, "large", "huge"] }],
    ["code-block", { script: "sub" }, { script: "super" }],
    [{ color: [] }, { background: [] }],
    ["link", "image", "video"],
    [{ direction: "rtl" }, "clean"]
  ],
  syntax: true,
  markdownShortcuts: {},
  magicUrl: true
};

export default class ReactQuill extends Component {
  quill;
  getEditor() {
    return this.quill.editor;
  }

  shouldComponentUpdate(nextProps) {
    return this.props.readOnly !== nextProps.readOnly || nextProps.refresh;
  }

  componentDidUpdate() {
    if (this.props.refresh) {
      this.quill.setContents(this.props.initialContent);
      if (!this.props.initialContent.ops.length) return;
      const text = this.quill.getText();
      if (text[text.length - 1] !== " ") {
        this.quill.insertText(text.length - 1, " ");
      }
      this.quill.setSelection(text.length, 0);
    }
  }

  componentDidMount() {
    const {
      placeholder,
      container,
      readOnly,
      initialContent,
      onChange,
      onSave
    } = this.props;

    this.quill = new Quill("#quill", {
      placeholder,
      bounds: container,
      modules,
      theme: "snow",
      readOnly
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
          shortKey: true
        },
        onSave.bind(this, this.quill)
      );
    }
  }

  componentWillUnmount() {
    this.quill.off("text-change", this.textChangeHandler);
  }

  textChangeHandler = (delta, oldDelta, source) => {
    if (source === "api") return;
    this.props.onChange(this.quill);
  };

  render() {
    console.log("rendering + ", this.props.refresh);
    return <pre id="quill" />;
  }
}
