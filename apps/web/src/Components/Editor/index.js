import React, { useEffect } from "react";
import "./editor.css";
import ReactQuill, { Quill } from "react-quill";
import "react-quill/dist/quill.bubble.css";
import "react-quill/dist/quill.snow.css";
import { Flex, Box } from "rebass";
import { Input } from "@rebass/forms";
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
  const ref = ref => (Editor.quillRef = ref);

  useEffect(() => {
    if (Editor.quillRef) {
      const quill = Editor.quillRef.getEditor();
      if (quill) {
        quill.keyboard.addBinding(
          {
            key: "S",
            shortKey: true
          },
          () => {
            /* save note here */
          }
        );
      }
    }
    // move the toolbar outside (easiest way)
    const toolbar = document.querySelector(".ql-toolbar.ql-snow");
    //const quill = document.querySelector(".quill");
    // const editor = document.querySelector(".editor");
    const toolbarContainer = document.querySelector("#toolbar");
    if (toolbar && toolbarContainer) {
      // const box = <Box>{toolbar}</Box>;
      toolbarContainer.appendChild(toolbar);
      //editor.appendChild(quill);
    }
  });

  return (
    <Flex
      className="editor"
      width={["0%", "60%", "70%"]}
      flex="1 1 auto"
      flexDirection="column"
    >
      <Input
        placeholder="Untitled"
        fontFamily="body"
        fontWeight="heading"
        fontSize="heading"
        display={["none", "flex", "flex"]}
        sx={{ borderWidth: 0, ":focus": { outline: "none" } }}
        px={3}
        py={3}
      />
      <Box id="toolbar" display={["none", "flex", "flex"]}></Box>
      <ReactQuill ref={ref} modules={modules} theme="snow" />
    </Flex>
  );
};
export default Editor;
