import React from "react";
import "./editor.css";
import ReactQuill, { Quill } from "react-quill";
import "react-quill/dist/quill.bubble.css";
import "react-quill/dist/quill.snow.css";
import { Flex, Box } from "rebass";
import { Input } from "@rebass/forms";
import MarkdownShortcuts from "./modules/markdown";
import MagicUrl from "quill-magic-url";
import { db, ev } from "../../common";
import { showSnack } from "../snackbar";
import * as Icon from "react-feather";
import Properties from "../properties/properties";

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

export default class Editor extends React.Component {
  title = "";
  timeout = "";
  timestamp = "";

  componentDidMount() {
    // move the toolbar outside (easiest way)
    const toolbar = document.querySelector(".ql-toolbar.ql-snow");
    const toolbarContainer = document.querySelector("#toolbar");
    if (toolbar && toolbarContainer) {
      toolbarContainer.appendChild(toolbar);
    }

    this.quill = this.quillRef.getEditor();
    this.quill.keyboard.addBinding(
      {
        key: "S",
        shortKey: true
      },
      async () => {
        await this.saveNote();
        showSnack("Note saved!", Icon.Check);
      }
    );

    ev.addListener("onNewNote", this.onNewNote.bind(this));
    ev.addListener("onOpenNote", this.onOpenNote.bind(this));
    ev.addListener("onClearNote", this.onClearNote.bind(this));
  }

  componentWillUnmount() {
    ev.removeListener("onNewNote", this.onNewNote.bind(this));
    ev.removeListener("onOpenNote", this.onOpenNote.bind(this));
    ev.removeListener("onClearNote", this.onClearNote.bind(this));
  }

  onNewNote(showSnack = true, cb = null) {
    clearTimeout(this.timeout);
    this.saveNote().then(() => {
      this.titleRef.value = "";
      this.timestamp = undefined;
      this.title = undefined;
      this.titleRef.focus();
      this.quill.setText("\n");
      cb && cb();
      if (showSnack) {
        showSnack("Let's start writing!", Icon.Edit2);
      }
    });
  }

  onClearNote(dateCreated = undefined) {
    if (dateCreated && dateCreated !== this.timestamp) return;
    this.onNewNote(false);
  }

  onOpenNote(note) {
    if (!note) return;
    this.onNewNote(false, () => {
      this.timestamp = note.dateCreated;
      this.title = note.title;
      this.titleRef.value = note.title;
      this.quill.setContents(note.content.delta);
      this.quill.setSelection(note.content.text.length - 1, 0); //to move the cursor to the end
    });
  }

  async saveNote() {
    let content = {
      delta: this.quill.getContents(),
      text: this.quill.getText()
    };
    if (!content.delta || content.text.length <= 1) return this.timestamp;
    let note = {
      content,
      title: this.title,
      dateCreated: this.timestamp
    };
    let t = await db.addNote(note);

    console.log(t);
    return t;
  }

  render() {
    return (
      <Flex width={["0%", "50%", "75%"]}>
        <Flex
          className="editor"
          flex="1 1 auto"
          flexDirection="column"
          onBlur={() => {
            ev.emit("refreshNotes");
          }}
        >
          <Input
            ref={ref => (this.titleRef = ref)}
            placeholder="Untitled"
            fontFamily="heading"
            fontWeight="heading"
            fontSize="heading"
            display={["none", "flex", "flex"]}
            sx={{
              borderWidth: 0,
              ":focus": { outline: "none" },
              paddingTop: 0,
              paddingBottom: 3
            }}
            px={2}
            onChange={e => (this.title = e.target.value)}
          />
          <Box id="toolbar" display={["none", "flex", "flex"]}></Box>
          <ReactQuill
            ref={ref => (this.quillRef = ref)}
            modules={modules}
            theme="snow"
            onChange={() => {
              clearTimeout(this.timeout);
              this.timeout = setTimeout(async () => {
                this.timestamp = await this.saveNote();
                console.log(this.timestamp);
              }, 1000);
            }}
          />
        </Flex>
        <Properties
          onPinned={state => {}}
          onFavorited={state => {}}
          onLocked={state => {}}
        />
      </Flex>
    );
  }
}
