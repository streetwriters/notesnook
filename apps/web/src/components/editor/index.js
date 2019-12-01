import React, { useState, useEffect } from "react";
import "./editor.css";
import ReactQuill, { Quill } from "react-quill";
import "react-quill/dist/quill.bubble.css";
import "react-quill/dist/quill.snow.css";
import { Flex, Box } from "rebass";
import { Input } from "@rebass/forms";
import MarkdownShortcuts from "./modules/markdown";
import MagicUrl from "quill-magic-url";
import { db, ev } from "../../common";

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
  markdownShortcuts: {},
  magicUrl: true
};

let timestamp = undefined;
let title = undefined;
async function saveNote(quill) {
  let content = {
    delta: quill.getContents(),
    text: quill.getText()
  };
  if (!content.delta || content.text.len <= 1) return;
  let note = {
    content,
    title,
    dateCreated: timestamp
  };
  timestamp = await db.addNote(note);
}
function startAutoSave(quill) {
  setInterval(async () => {
    if (Date.now() - Editor.lastSaveTimestamp <= 1000) {
      await saveNote(quill);
    }
  }, 2000);
}
const Editor = props => {
  const ref = ref => (Editor.quillRef = ref);
  const titleRef = ref => (Editor.titleRef = ref);
  useEffect(() => {
    const quill = Editor.quillRef.getEditor();
    quill.keyboard.addBinding(
      {
        key: "S",
        shortKey: true
      },
      async () => {
        await saveNote(quill);
      }
    );

    let saveInterval = startAutoSave(quill);
    function onNewNote() {
      clearInterval(saveInterval);
      saveNote(quill).then(() => {
        title = undefined;
        Editor.titleRef.value = "";
        Editor.titleRef.focus();
        quill.setText("\n");
        Editor.lastSaveTimestamp = 0;
        saveInterval = startAutoSave(quill);
      });
    }
    ev.addListener("onNewNote", onNewNote);
    return () => {
      clearInterval(saveInterval);
      ev.removeListener("onNewNote", onNewNote);
    };
  });

  useEffect(() => {
    // move the toolbar outside (easiest way)
    const toolbar = document.querySelector(".ql-toolbar.ql-snow");
    const toolbarContainer = document.querySelector("#toolbar");
    if (toolbar && toolbarContainer) {
      toolbarContainer.appendChild(toolbar);
    }
  }, []);
  return (
    <Flex
      className="editor"
      width={["0%", "60%", "70%"]}
      flex="1 1 auto"
      flexDirection="column"
    >
      <Input
        ref={titleRef}
        placeholder="Untitled"
        fontFamily="body"
        fontWeight="heading"
        fontSize="heading"
        display={["none", "flex", "flex"]}
        sx={{ borderWidth: 0, ":focus": { outline: "none" } }}
        px={3}
        py={3}
        onChange={e => (title = e.target.value)}
      />
      <Box id="toolbar" display={["none", "flex", "flex"]}></Box>
      <ReactQuill
        ref={ref}
        modules={modules}
        theme="snow"
        onChange={() => (Editor.lastSaveTimestamp = Date.now())}
      />
    </Flex>
  );
};
export default Editor;
