import React, { useEffect } from "react";
import "./editor.css";
import ReactQuill, { Quill } from "react-quill";
import "react-quill/dist/quill.bubble.css";
import "react-quill/dist/quill.snow.css";
import { Box } from "rebass";
import MarkdownShortcuts from "./modules/markdown";
import MagicUrl from "quill-magic-url";

Quill.register("modules/markdownShortcuts", MarkdownShortcuts);
Quill.register("modules/magicUrl", MagicUrl);

const modules = {
  toolbar: [
    [{ header: [1, 2, 3, 4, 5, 6] }],
    ["bold", "italic", "underline", "strike", "blockquote", { align: [] }],
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
  markdownShortcuts: {},
  magicUrl: true
};

const Editor = props => {
  useEffect(() => {
    // move the toolbar outside (easiest way)
    const toolbar = document.querySelector(".ql-toolbar.ql-snow");
    const quill = document.querySelector(".quill");
    const editor = document.querySelector(".editor");
    if (toolbar && quill && editor) {
      editor.appendChild(toolbar);
      editor.appendChild(quill);
    }
  });
  return (
    <Box
      className="editor"
      display="flex"
      flex="1 1 auto"
      flexDirection="column"
    >
      <input className="editor-title" placeholder="Untitled" />
      <ReactQuill modules={modules} theme="snow" />
    </Box>
  );
};
export default Editor;
