import React, { useEffect } from "react";
import "tinymce/tinymce";
import "tinymce/icons/default";
import "tinymce/themes/silver";
import "tinymce/plugins/table";
import "tinymce/plugins/autoresize";
import "tinymce/plugins/quickbars";
import "tinymce/plugins/searchreplace";
import "tinymce/plugins/lists";
import "tinymce/plugins/advlist";
import "tinymce/plugins/autolink";
import "tinymce/plugins/textpattern";
import "tinymce/plugins/textcolor";
import "tinymce/plugins/paste";
import "tinymce/plugins/importcss";
import "tinymce/plugins/hr";
import "tinymce/plugins/imagetools";
import "tinymce/plugins/noneditable";
import "tinymce/plugins/table";
import "tinymce/plugins/directionality";
import "tinymce/plugins/media";
import "./plugins/code";
import "./plugins/shortlink";
import "./plugins/quickimage";
import "./editor.css";
import { Editor } from "@tinymce/tinymce-react";
import { isUserPremium } from "../../common";
import { showBuyDialog } from "../dialogs/buy-dialog";
import { useStore as useThemeStore } from "../../stores/theme-store";

const markdownPatterns = [
  { start: "```", replacement: "<pre></pre>" },
  { start: "*", end: "*", format: "italic" },
  { start: "_", end: "_", format: "italic" },
  { start: "**", end: "**", format: "bold" },
  { start: "~~", end: "~~", format: "strikethrough" },
  { start: "`", end: "`", format: "code" },
  { start: "#", format: "h1" },
  { start: "##", format: "h2" },
  { start: "###", format: "h3" },
  { start: "####", format: "h4" },
  { start: "#####", format: "h5" },
  { start: "######", format: "h6" },
  { start: "* ", cmd: "InsertUnorderedList" },
  { start: "- ", cmd: "InsertUnorderedList" },
  { start: "> ", format: "blockquote" },
  {
    start: "1. ",
    cmd: "InsertOrderedList",
    value: { "list-style-type": "decimal" },
  },
  {
    start: "1) ",
    cmd: "InsertOrderedList",
    value: { "list-style-type": "decimal" },
  },
  {
    start: "a. ",
    cmd: "InsertOrderedList",
    value: { "list-style-type": "lower-alpha" },
  },
  {
    start: "a) ",
    cmd: "InsertOrderedList",
    value: { "list-style-type": "lower-alpha" },
  },
  {
    start: "i. ",
    cmd: "InsertOrderedList",
    value: { "list-style-type": "lower-roman" },
  },
  {
    start: "i) ",
    cmd: "InsertOrderedList",
    value: { "list-style-type": "lower-roman" },
  },
  { start: "---", replacement: "<hr/>" },
  { start: "--", replacement: "—" },
  { start: "(c)", replacement: "©" },
];

const premiumCommands = [
  "InsertUnorderedList",
  "InsertOrderedList",
  "indent",
  "JustifyFull",
  "JustifyLeft",
  "JustifyRight",
  "JustifyCenter",
  "FontSize",
  "mceApplyTextcolor",
  "mceInsertContent",
  "mceMedia",
  "mceDirectionRTL",
];

function useSkin() {
  const theme = useThemeStore((store) => store.theme);
  return theme === "dark"
    ? ["skins/notesnook", "skins/notesnook-dark"]
    : ["skins/notesnook-dark", "skins/notesnook"];
}

function TinyMCE(props) {
  const {
    changeInterval,
    onChange,
    onWordCountChanged,
    onSave,
    placeholder,
    simple,
    initialValue,
    onFocus,
    editorRef,
  } = props;
  const [oldSkin, newSkin] = useSkin();
  const tinymceRef = editorRef;
  useEffect(() => {
    if (tinymceRef.current.editor.initialized) {
      tinymceRef.current.editor.dom.styleSheetLoader.unload(
        `${oldSkin}/content.min.css`
      );
      tinymceRef.current.editor.ui.styleSheetLoader.unload(
        `${oldSkin}/skin.min.css`
      );
      tinymceRef.current.editor.dom.styleSheetLoader.load(
        `${newSkin}/content.min.css`
      );
      tinymceRef.current.editor.ui.styleSheetLoader.load(
        `${newSkin}/skin.min.css`
      );
    }
  }, [tinymceRef, newSkin, oldSkin]);
  return (
    <Editor
      ref={tinymceRef}
      onFocus={onFocus}
      initialValue={initialValue}
      init={{
        menubar: false,
        statusbar: false,
        link_quicklink: true,
        width: "100%",
        plugins:
          "paste importcss searchreplace autolink directionality code quickimage shortlink media table hr advlist lists imagetools textpattern noneditable quickbars autoresize",
        toolbar_mode: "sliding",
        contextmenu: false,
        quickbars_selection_toolbar:
          "bold italic code h2 h3 quicklink blockquote",
        quickbars_insert_toolbar: false,
        skin_url: newSkin,
        content_css: newSkin,
        content_style: `
        span.diff-del {
          background-color: #FDB0C0;  
        }

        span.diff-ins {
          background-color: #CAFFFB;  
        }
`,
        toolbar: simple
          ? false
          : `bold italic underline strikethrough blockquote code | fontsizeselect formatselect | alignleft aligncenter alignright alignjustify | outdent indent |  numlist bullist | forecolor backcolor removeformat | hr | image media link table | ltr rtl | searchreplace`,
        mobile: {
          toolbar_mode: "scrolling",
        },
        block_formats:
          "Paragraph=p; Header 2=h2; Header 3=h3; Header 4=h4; Header 5=h5; Header 6=h6; Code=pre",
        textpattern_patterns: markdownPatterns,
        placeholder: placeholder || "Start writing your note here...",
        target_list: false,
        link_title: false,
        imagetools_toolbar: "rotateleft rotateright | flipv fliph",
        image_upload_handler: function (blobInfo, success) {
          success(
            "data:" + blobInfo.blob().type + ";base64," + blobInfo.base64()
          );
        },
        setup: (editor) => {
          editor.on("ScrollIntoView", (e) => {
            e.preventDefault();
            if (editor.pauseScrollIntoView) {
              editor.pauseScrollIntoView = false;
            } else {
              e.elm.scrollIntoView({
                behavior: "smooth",
                block: "nearest",
              });
            }
          });
        },
        browser_spellcheck: true,
        autoresize_bottom_margin: 100,
      }}
      onBeforeExecCommand={async (command) => {
        if (
          premiumCommands.some(
            (cmd) => command.command === cmd && !command?.value?.paste
          ) &&
          !isUserPremium()
        ) {
          command.preventDefault();
          await showBuyDialog("editor");
          return;
        }
      }}
      onKeyDown={(e) => {
        if (e.ctrlKey && e.key === "s") {
          e.preventDefault();
          onSave();
        }
      }}
      onEditorChange={(content, editor) => {
        if (onWordCountChanged) {
          const text = editor.getContent({
            format: "text",
            no_events: true,
            get: true,
            content,
          });
          onWordCountChanged(countWords(text));
        }

        if (editor.isLoading) {
          editor.isLoading = false;
          return;
        }

        clearTimeout(editor.changeTimeout);
        editor.changeTimeout = setTimeout(
          () => onChange(content, editor),
          changeInterval
        );
      }}
    />
  );
}

export default React.memo(TinyMCE, () => true);

function countWords(str) {
  let count = 0;
  let shouldCount = false;

  for (var i = 0; i < str.length; ++i) {
    const s = str[i];

    if (s === " " || s === "\r" || s === "\n" || s === "*") {
      if (!shouldCount) continue;
      ++count;
      shouldCount = false;
    } else {
      shouldCount = true;
    }
  }

  if (shouldCount) ++count;
  return count;
}
