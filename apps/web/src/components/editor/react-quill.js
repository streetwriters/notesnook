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
import { isUserPremium } from "../../common";

Quill.register("modules/markdownShortcuts", MarkdownShortcuts);
Quill.register("modules/magicUrl", MagicUrl);
Quill.register("modules/focus", QuillFocus);

let Embed = Quill.import("blots/embed");

function lineBreakMatcher() {
  return { ops: [{ insert: { manualbreak: true } }] };
}

class SmartBreak extends Embed {}
SmartBreak.blotName = "manualbreak";
SmartBreak.tagName = "BR";
Quill.register(SmartBreak);

function moduleHandlerWrapper(type, isSimple) {
  return async function (value) {
    if (isSimple && !isUserPremium()) {
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
          [{ header: "2" }, { header: "3" }],
          [
            { align: "" },
            { align: "center" },
            { align: "right" },
            { align: "justify" },
          ],
          [{ list: "ordered" }, { list: "bullet" }, { list: "check" }],
          [{ indent: "-1" }, { indent: "+1" }],
          ["code-block", { script: "sub" }, { script: "super" }],
          [{ color: [] }, { background: [] }],
          [{ header: [false, 2, 3, 4, 5, 6] }],
          [{ size: ["small", false, "large", "huge"] }],
          [("link", "image", "video")],
          [{ direction: "rtl" }, "clean"],
        ],
        handlers: {
          list: moduleHandlerWrapper("list", isSimple),
          indent: moduleHandlerWrapper("indent", isSimple),
          direction: moduleHandlerWrapper("direction", isSimple),
          image: moduleHandlerWrapper("image", isSimple),
          video: moduleHandlerWrapper("video", isSimple),
          //formula: moduleHandlerWrapper("formula", isSimple),
          color: moduleHandlerWrapper("color", isSimple),
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
  clipboard: {
    matchers: [["BR", lineBreakMatcher]],
    matchVisual: false,
  },
  keyboard: {
    bindings: {
      linebreak: {
        key: "Enter",
        shiftKey: true,
        handler: function (range) {
          // let currentLeaf = this.quill.getLeaf(range.index)[0];
          // let nextLeaf = this.quill.getLeaf(range.index + 1)[0];
          this.quill.setSelection(range.index, "silent");
          //this.quill.insertText(range.index, "\n", "user");

          this.quill.insertEmbed(range.index, "manualbreak", true, "user");

          // Insert a second break if:
          // At the end of the editor, OR next leaf has a different parent (<p>)
          // if (nextLeaf === null || currentLeaf.parent !== nextLeaf.parent) {
          //   this.quill.insertEmbed(range.index, "manualbreak", true, "user");
          // }

          // Now that we've inserted a line break, move the cursor forward
          this.quill.setSelection(range.index + 1, Quill.sources.SILENT);
        },
      },
    },
  },
});

//
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
      onSelectAll,
      modules,
      id,
      isSimple,
      isFocusMode,
      onQuillInitialized,
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

    if (onSelectAll) {
      this.quill.keyboard.addBinding(
        {
          key: 65,
          ctrlKey: true,
        },
        {},
        onSelectAll.bind(this, this.quill)
      );
    }

    if (onQuillInitialized) onQuillInitialized();
  }

  componentWillUnmount() {
    if (!this.quill) return;
    this.quill.off("text-change", this.textChangeHandler);
  }

  textChangeHandler = (delta, oldDelta, source) => {
    if (source === "init") return;
    if (this.props.onWordCountChanged)
      this.props.onWordCountChanged(this.getWordCount(oldDelta.compose(delta)));
    clearTimeout(this.changeTimeout);
    this.changeTimeout = setTimeout(
      this.props.onChange,
      this.props.changeInterval
    );
  };

  getWordCount(delta) {
    const wordCount = delta.reduce((prev, curr) => {
      if (typeof curr.insert !== "string") return prev;
      const text = curr.insert.trim();
      if (text <= 1) return prev;
      const count = countWords(text); // curr.insert.split(wordCountRegex).length;
      return prev + count;
    }, 0);
    this.words = wordCount;
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
        <Text as="pre" onFocus={this.props.onFocus} id={this.props.id} />
      </Box>
    );
  }
}

// const wordCountRegex = /\b\S+\b/g;
function countWords(str) {
  let count = 0;
  let shouldCount = false;

  for (var i = 0; i < str.length; ++i) {
    const s = str.charCodeAt(i);

    // 32 = space
    // 13 = \r
    // 10 = \n
    // 42 = *
    if (s === 32 || s === 13 || s === 10 || s === 42 || s === 9) {
      if (shouldCount) continue;
      ++count;
      shouldCount = true;
    } else {
      shouldCount = false;
    }
  }
  if (!shouldCount) ++count;
  return count;
}
