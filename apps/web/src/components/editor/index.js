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
  syntax: true,
  markdownShortcuts: {},
  magicUrl: true
};

export default class Editor extends React.Component {
  title = "";
  timeout = "";
  id = "";
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
    ev.addListener("onNoteFavorited", this.onNoteFavorite.bind(this));
    ev.addListener("onNotePinned", this.onNotePin.bind(this));
  }

  componentWillUnmount() {
    ev.removeListener("onNewNote", this.onNewNote.bind(this));
    ev.removeListener("onOpenNote", this.onOpenNote.bind(this));
    ev.removeListener("onClearNote", this.onClearNote.bind(this));
    ev.removeListener("onNoteFavorited", this.onNoteFavorite.bind(this));
    ev.removeListener("onNotePinned", this.onNotePin.bind(this));
  }

  onNoteFavorite(favorite, id) {
    if (id && id !== this.id) return;
    this.setState({ favorite });
  }

  onNotePin(pinned, id) {
    if (id && id !== this.id) return;
    this.setState({ pinned });
  }

  onNewNote(context, show = true, cb = null) {
    clearTimeout(this.timeout);
    this.saveNote().then(() => {
      this.titleRef.value = "";
      this.id = undefined;
      this.title = undefined;
      this.titleRef.focus();
      this.quill.setText("\n");
      this.setState({
        colors: [...this.state.colors, ...context.colors],
        tags: [...this.state.tags, ...context.tags]
      });
      console.log(this.state.colors);
      ev.emit("refreshNotes");
      cb && cb();
      if (show) {
        showSnack("Let's start writing!", Icon.Edit2);
      }
    });
  }

  onClearNote(id = undefined) {
    if (id && id !== this.id) return;
    this.onNewNote(null, false);
  }

  onOpenNote(note) {
    if (!note) return;
    this.onNewNote(null, false, async () => {
      let dbNote = db.notes.note(note.id);
      if (!dbNote) return this.onNewNote(null, false);
      this.id = note.id;
      this.title = note.title;
      this.titleRef.value = note.title;
      this.pinned = note.pinned;
      this.favorite = note.favorite;
      this.tags = note.tags;
      this.setState({
        pinned: this.pinned,
        favorite: this.favorite,
        colors: note.colors,
        tags: note.tags
      });
      let delta = await dbNote.delta();
      this.quill.setContents(delta);
      this.quill.setSelection(note.content.text.length - 1, 0); //to move the cursor to the end
    });
  }

  async saveNote() {
    let content = {
      delta: this.quill.getContents(),
      text: this.quill.getText()
    };
    if (!this.title && (!content.delta || content.text.length <= 1))
      return this.id;
    let note = {
      content,
      title: this.title,
      id: this.id,
      favorite: this.favorite,
      pinned: this.pinned,
      colors: this.state.colors
      //tags: this.state.tags
    };
    return await db.notes.add(note);
  }

  save() {
    clearTimeout(this.timeout);
    this.timeout = setTimeout(async () => {
      this.id = await this.saveNote();
      ev.emit("refreshNotes");
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
              paddingBottom: 0
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
            let colors = [...this.state.colors];
            if (colors.includes(color.label)) {
              colors.splice(colors.indexOf(color.label), 1);
            } else {
              colors[colors.length] = color.label;
            }
            this.setState({ colors });
          }}
          tags={this.state.tags}
          addTag={async tag => {
            let tags = [...this.state.tags];
            if (tags.includes(tag)) {
              tags.splice(tags.indexOf(tag), 1);
            } else {
              tags[this.state.tags.length] = tag;
            }
            this.setState({ tags });
            if (this.id) await db.notes.note(this.id).tag(tag);
          }}
          onLocked={state => {}}
        />
      </Flex>
    );
  }
}
