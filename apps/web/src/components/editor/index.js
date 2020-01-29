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
import Properties from "../properties";

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
  favorite = false;
  pinned = false;

  constructor(props) {
    super(props);
    this.state = {
      pinned: false,
      favorite: false,
      colors: [],
      tags: []
    };
  }

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

  onNewNote(show = true, cb = null) {
    clearTimeout(this.timeout);
    this.saveNote().then(() => {
      this.titleRef.value = "";
      this.timestamp = undefined;
      this.title = undefined;
      this.titleRef.focus();
      this.quill.setText("\n");
      cb && cb();
      if (show) {
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
      this.pinned = note.pinned;
      this.favorite = note.favorite;
      this.setState({
        pinned: this.pinned,
        favorite: this.favorite,
        colors: note.colors
      });
      this.quill.setContents(note.content.delta);
      this.quill.setSelection(note.content.text.length - 1, 0); //to move the cursor to the end
    });
  }

  async saveNote() {
    let content = {
      delta: this.quill.getContents(),
      text: this.quill.getText()
    };
    if (!this.title && (!content.delta || content.text.length <= 1))
      return this.timestamp;
    let note = {
      content,
      title: this.title,
      dateCreated: this.timestamp,
      favorite: this.favorite,
      pinned: this.pinned,
      colors: this.state.colors
      //TODO add tags once the database is done
    };
    let t = await db.addNote(note);
    return t;
  }

  save() {
    clearTimeout(this.timeout);
    this.timeout = setTimeout(async () => {
      this.timestamp = await this.saveNote();
    }, 1000);
  }

  render() {
    return (
      <Flex width={["0%", "0%", "100%"]}>
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
            onChange={e => {
              this.title = e.target.value;
              this.save();
            }}
          />
          <Box id="toolbar" display={["none", "flex", "flex"]}></Box>
          <ReactQuill
            ref={ref => (this.quillRef = ref)}
            modules={modules}
            theme="snow"
            onChange={() => {
              this.save();
            }}
          />
        </Flex>
        <Properties
          pinned={this.state.pinned}
          favorite={this.state.favorite}
          onPinned={state => {
            this.pinned = state;
            this.save();
          }}
          onFavorited={state => {
            this.favorite = state;
            this.save();
          }}
          selectedColors={this.state.colors}
          colorSelected={color => {
            if (this.state.colors.includes(color.label)) {
              this.state.colors.splice(
                this.state.colors.indexOf(color.label),
                1
              );
            } else {
              this.state.colors[this.state.colors.length] = color.label;
            }
            this.setState({ colors: this.state.colors });
          }}
          tags={this.state.tags}
          addTag={tag => {
            if (this.state.tags.includes(tag)) {
              this.state.tags.splice(this.state.tags.indexOf(tag), 1);
            } else {
              this.state.tags[this.state.tags.length] = tag;
            }
            this.setState({ tags: this.state.tags });
          }}
          onLocked={state => {}}
        />
      </Flex>
    );
  }
}
