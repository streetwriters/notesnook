import React, { Component } from "react";
import Quill from "quill";
import Toolbar from "quill/modules/toolbar";
import BaseTheme from "quill/themes/base";
import "quill/dist/quill.snow.css";
import "quill/dist/quill.core.css";
import "./modules/betterlist";
import MarkdownShortcuts from "./modules/markdown";
import MagicUrl from "quill-magic-url";
import { Box, Text } from "rebass";
import QuillFocus from "./modules/focus";
import { isMobile } from "../../utils/dimensions";
import { showBuyDialog } from "../dialogs/buy-dialog";
import "./editor.css";

Quill.register("modules/markdownShortcuts", MarkdownShortcuts);
Quill.register("modules/magicUrl", MagicUrl);
Quill.register("modules/focus", QuillFocus);

function moduleHandlerWrapper(type, isSimple) {
  return async function (value) {
    if (isSimple) {
      await showBuyDialog();
      return;
    }
    handlers[type].call(this, value);
  };
}

const handlers = {
  ...Toolbar.DEFAULTS.handlers,
  ...BaseTheme.DEFAULTS.modules.toolbar.handlers,
  color: function (color) {
    this.quill.format("color", color, "user");
  },
  background: function (color) {
    this.quill.format("background", color, "user");
  },
  align: function (position) {
    this.quill.format("align", position, "user");
  },
  "code-block": function (value) {
    this.quill.format("code-block", value, "user");
  },
  size: function (value) {
    this.quill.format("size", value, "user");
  },
  script: function (value) {
    this.quill.format("script", value, "user");
  },
};

const quillModules = (isSimple, isFocusMode, isMobile) => ({
  toolbar: isMobile
    ? [{ header: "2" }, "bold", "italic", "underline", "link", "code-block"]
    : {
        container: [
          ["bold", "italic", "underline", "strike", "blockquote"],
          [{ header: "2" }, { header: "3" }, { header: [false, 4, 5, 6] }],
          [
            { align: "" },
            { align: "center" },
            { align: "right" },
            { align: "justify" },
          ],
          [{ list: "ordered" }, { list: "bullet" }, { list: "check" }],
          [{ indent: "-1" }, { indent: "+1" }],
          [{ size: ["small", false, "large", "huge"] }],
          ["code-block", { script: "sub" }, { script: "super" }],
          [{ color: [] }, { background: [] }],
          ["link", "image", "video"],
          [{ direction: "rtl" }, "clean"],
        ],
        handlers: {
          list: moduleHandlerWrapper("list", isSimple),
          indent: moduleHandlerWrapper("indent", isSimple),
          direction: moduleHandlerWrapper("direction", isSimple),
          image: moduleHandlerWrapper("image", isSimple),
          video: moduleHandlerWrapper("video", isSimple),
          formula: moduleHandlerWrapper("formula", isSimple),
          color: moduleHandlerWrapper("formula", isSimple),
          background: moduleHandlerWrapper("background", isSimple),
          align: moduleHandlerWrapper("align", isSimple),
          "code-block": moduleHandlerWrapper("code-block", isSimple),
          size: moduleHandlerWrapper("size", isSimple),
          script: moduleHandlerWrapper("script", isSimple),
        },
      },
  // syntax: true,
  markdownShortcuts: isSimple ? undefined : {},
  magicUrl: true,
  history: { maxStack: 1000 * 5 },
  focus: {
    enabled: isFocusMode,
    focusClass: "focused-blot", // Defaults to .focused-blot.
  },
});

// const wordCountRegex = /\b\S+\b/g;
export default class ReactQuill extends Component {
  /**
   * @type {Quill}
   */
  quill;
  changeTimeout;
  words = 0;
  currentPage = 0;
  pages = [];
  getEditor() {
    return this.quill.editor;
  }

  shouldComponentUpdate(nextProps) {
    return (
      this.props.readOnly !== nextProps.readOnly ||
      this.props.isSimple !== nextProps.isSimple ||
      this.props.isFocusMode !== nextProps.isFocusMode
    );
  }

  componentDidUpdate() {
    const { isFocusMode } = this.props;

    const focus = this.quill.getModule("focus");
    focus.toggle(isFocusMode);
  }

  componentDidMount() {
    this._initializeQuill();
  }

  _initializeQuill() {
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
      isFocusMode,
    } = this.props;

    this.quill = new Quill("#" + id, {
      placeholder,
      bounds: container,
      scrollingContainer: scrollContainer,
      modules: modules || quillModules(isSimple, isFocusMode, isMobile()),
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

  textChangeHandler = (delta, _oldDelta, source) => {
    if (source === "init") return;
    if (this.props.onWordCountChanged)
      this.props.onWordCountChanged(this.getWordCount(delta));
    clearTimeout(this.changeTimeout);
    this.changeTimeout = setTimeout(
      this.props.onChange,
      this.props.changeInterval
    );
  };

  getWordCount(delta) {
    const wordCount = delta.reduce((prev, curr) => {
      if (!curr.insert || curr.insert.image) return prev;
      const text = curr.insert.trim();
      if (text <= 1) return prev;
      const count = countWords(text); // curr.insert.split(wordCountRegex).length;
      return prev + count;
    }, 0);
    this.words += wordCount;
    return this.words;
  }

  init(pages, delta) {
    this.pages = pages;
    this.currentPage = 0;
    this.words = 0;
    this.words = this.getWordCount(delta);
    this.props.onWordCountChanged(this.words);
    this.quill.setContents(pages[this.currentPage], "init");
  }

  render() {
    return (
      <Box mx={[2, 2, 0]}>
        <Text
          as="pre"
          sx={{ cursor: "text" }}
          onFocus={this.props.onFocus}
          id={this.props.id}
        />
      </Box>
    );
  }
}

function countWords(str) {
  let count = 1;
  for (var i = 0; i < str.length; ++i) {
    const char = str[i];
    if (char === " " || char === "\n" || char === "\t" || char === "\r")
      ++count;
  }
  return count;
}
