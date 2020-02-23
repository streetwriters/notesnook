import React, { useEffect } from "react";
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
//import { store } from "../../stores/note-store";
import { useStore } from "../../stores/editor-store";

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

function Editor() {
  const title = useStore(store => store.session.title);
  const delta = useStore(store => store.session.content.delta);
  const setSession = useStore(store => store.setSession);
  console.log(delta, title);
  useEffect(() => {
    // move the toolbar outside (easiest way)
    const toolbar = document.querySelector(".ql-toolbar.ql-snow");
    const toolbarContainer = document.querySelector("#toolbar");
    if (toolbar && toolbarContainer) {
      toolbarContainer.appendChild(toolbar);
    }
  }, []);

  return (
    <Flex width={["0%", "0%", "100%"]}>
      <Flex className="editor" flex="1 1 auto" flexDirection="column">
        <TitleBox
          title={title}
          setTitle={title =>
            setSession(state => {
              state.session.title = title;
            })
          }
        />
        <Box id="toolbar" display={["none", "flex", "flex"]} />
        <ReactQuill
          modules={modules}
          theme="snow"
          defaultValue={delta}
          onChange={(content, delta, source, editor) => {
            if (source === "api") return;
            setSession(state => {
              state.session.content = {
                delta: editor.getContents(),
                text: editor.getText()
              };
            });
          }}
        />
      </Flex>
    </Flex>
  );
}

export default Editor;

class TitleBox extends React.Component {
  shouldComponentUpdate(nextProps) {
    return nextProps.title !== this.props.title;
  }
  render() {
    const { title, setTitle } = this.props;
    return (
      <Input
        autoFocus
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
        value={title}
        onChange={e => {
          setTitle(e.target.value);
        }}
      />
    );
  }
}

/* 

export default class Editor extends React.Component {
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

    // ev.addListener("onNewNote", this.onNewNote.bind(this));
    // ev.addListener("onOpenNote", this.onOpenNote.bind(this));
    // ev.addListener("onClearNote", this.onClearNote.bind(this));
  }

  componentWillUnmount() {
    //  ev.removeListener("onNewNote", this.onNewNote.bind(this));
    //  ev.removeListener("onOpenNote", this.onOpenNote.bind(this));
    //  ev.removeListener("onClearNote", this.onClearNote.bind(this));
  }

  onNewNote(show = true, cb = null) {
    clearTimeout(this.timeout);
    this.saveNote().then(() => {
      this.titleRef.value = "";
      this.id = undefined;
      this.title = undefined;
      this.titleRef.focus();
      this.quill.setText("\n");
      cb && cb();
      if (show) {
        showSnack("Let's start writing!", Icon.Edit2);
      }
    });
  }

  onClearNote(id = undefined) {
    if (id && id !== this.id) return;
    this.onNewNote(false);
  }

  onOpenNote(note) {
    if (!note) return;
    this.onNewNote(false, async () => {
      let dbNote = db.notes.note(note.id);
      if (!dbNote) return this.onNewNote(false);
      this.id = note.id;
      this.title = note.title;
      this.titleRef.value = note.title;
      this.pinned = note.pinned;
      this.favorite = note.favorite;
      this.setState({
        pinned: this.pinned,
        favorite: this.favorite,
        colors: note.colors
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
      //TODO add tags once the database is done
    };
    return await db.notes.add(note);
  }

  save() {
    clearTimeout(this.timeout);
    this.timeout = setTimeout(async () => {
      this.id = await this.saveNote();
      store.getState().init();
    }, 1000);
  }

  render() {
    return (
      <Flex width={["0%", "0%", "100%"]}>
        <Flex className="editor" flex="1 1 auto" flexDirection="column">
          <Input
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
          <Box id="toolbar" display={["none", "flex", "flex"]} />
          <ReactQuill
            ref={ref => (this.quillRef = ref)}
            modules={modules}
            theme="snow"
            onChange={() => {
              this.save();
            }}
          />
        </Flex>
        {/* <Properties
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
          addTag={tag => {
            let tags = [...this.state.tags];
            if (tags.includes(tag)) {
              tags.splice(tags.indexOf(tag), 1);
            } else {
              tags[this.state.tags.length] = tag;
            }
            this.setState({ tags });
          }}
          onLocked={state => {}}
        />
 }
      </Flex>
    );
  }
}
 */
