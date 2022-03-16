import React, { useEffect } from "react";
import "./editor.css";
import "@streetwriters/tinymce-plugins/codeblock/styles.css";
import "tinymce/tinymce";
// eslint-disable-next-line import/no-webpack-loader-syntax
import "file-loader?name=static/js/icons/default/icons.js&esModule=false!tinymce/icons/default/icons.min.js";
// eslint-disable-next-line import/no-webpack-loader-syntax
import "file-loader?name=static/js/themes/silver/theme.js&esModule=false!tinymce/themes/silver/theme.min.js";
import "tinymce/plugins/table";
import "tinymce/plugins/autoresize";
import "tinymce/plugins/searchreplace";
import "tinymce/plugins/lists";
import "tinymce/plugins/advlist";
import "tinymce/plugins/autolink";
import "tinymce/plugins/textpattern";
import "tinymce/plugins/textcolor";
import "tinymce/plugins/importcss";
import "tinymce/plugins/hr";
import "tinymce/plugins/imagetools";
import "tinymce/plugins/noneditable";
import "tinymce/plugins/table";
import "tinymce/plugins/directionality";
import "tinymce/plugins/media";
import { processPastedContent } from "@streetwriters/tinymce-plugins/codeblock";
import "@streetwriters/tinymce-plugins/inlinecode";
import "@streetwriters/tinymce-plugins/shortlink";
import "@streetwriters/tinymce-plugins/checklist";
import "@streetwriters/tinymce-plugins/collapsibleheaders";
import "@streetwriters/tinymce-plugins/paste";
import "@streetwriters/tinymce-plugins/shortcuts";
import "@streetwriters/tinymce-plugins/keyboardquirks";
import "@streetwriters/tinymce-plugins/attachmentshandler";
import "@streetwriters/tinymce-plugins/contenthandler";
import "@streetwriters/tinymce-plugins/bettertable";
import { addPickerPlugin, attachFile } from "./plugins/picker";
import "./plugins/icons";
import "./plugins/attachmentshandler.css";
import "@streetwriters/tinymce-plugins/blockescape";
import { Editor } from "@tinymce/tinymce-react";
import { showBuyDialog } from "../../common/dialog-controller";
import { useStore as useThemeStore } from "../../stores/theme-store";
import { isTablet } from "../../utils/dimensions";
import { showToast } from "../../utils/toast";
import { useIsUserPremium } from "../../hooks/use-is-user-premium";
import { AppEventManager, AppEvents } from "../../common/app-events";
import { EV, EVENTS } from "notes-core/common";
import { downloadAttachment } from "../../common/attachments";

const markdownPatterns = [
  { start: "```", replacement: "<pre></pre>" },
  { start: "*", end: "*", format: "italic" },
  { start: "_", end: "_", format: "italic" },
  { start: "**", end: "**", format: "bold" },
  { start: "~~", end: "~~", format: "strikethrough" },
  { start: "`", end: "`", cmd: "mceInsertInlineCode" },
  { start: "# ", format: "h1" },
  { start: "## ", format: "h2" },
  { start: "### ", format: "h3" },
  { start: "#### ", format: "h4" },
  { start: "##### ", format: "h5" },
  { start: "###### ", format: "h6" },
  { start: "- [x]", cmd: "insertChecklist", value: { checked: true } },
  { start: "- []", cmd: "insertChecklist" },
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
  "JustifyFull",
  "JustifyLeft",
  "JustifyRight",
  "JustifyCenter",
  "FontSize",
  "mceMedia",
  "mceAttachFile",
  "mceAttachImage",
];

function useSkin() {
  const theme = useThemeStore((store) => store.theme);
  const host = window.location.origin;
  return theme === "dark"
    ? [host + "/skins/notesnook", host + "/skins/notesnook-dark"]
    : [host + "/skins/notesnook-dark", host + "/skins/notesnook"];
}

const plugins = {
  default:
    "importcss searchreplace autolink directionality media table hr advlist lists imagetools noneditable autoresize",
  custom:
    "bettertable contenthandler icons blockescape keyboardquirks collapsibleheaders shortlink paste codeblock inlinecode checklist attachmentshandler",
  pro: "textpattern picker",
};

/**
 * 1. input - called on every change
 * 2. paste - called after content is pasted
 * 3. ExecCommand - called after changes such as formatting.
 * 4. ObjectResized - called after an image/object has resized
 * 5. cut - called when content is cut
 * 6. Redo - called after redo is done
 * 7. Undo - called after undo is done
 * 8. NewBlock - called when a new block is created (e.g. new list item)
 * 9. ListMutation - called when a list is toggled
 * We do not include the "change" event here as it is only
 * invoked after the editor loses focus.
 */
const changeEvents =
  "input paste ExecCommand ObjectResized cut Redo Undo NewBlock ListMutation";
const ignoredCommand = ["mcerepaint", "mcefocus", "selectall"];

function TinyMCE(props) {
  const {
    changeInterval,
    onChange,
    onSave,
    placeholder,
    simple,
    onFocus,
    editorRef,
    onInit,
    sessionId,
  } = props;
  const [oldSkin, newSkin] = useSkin();
  const isUserPremium = useIsUserPremium();

  const tinymceRef = editorRef;
  useEffect(() => {
    if (!tinymceRef.current.editor.dom) return;

    tinymceRef.current.editor.dom.styleSheetLoader.unload(
      `${oldSkin}/content.inline.min.css`
    );
    tinymceRef.current.editor.ui.styleSheetLoader.unload(
      `${oldSkin}/skin.min.css`
    );
    tinymceRef.current.editor.dom.styleSheetLoader.load(
      `${newSkin}/content.inline.min.css`
    );
    tinymceRef.current.editor.ui.styleSheetLoader.load(
      `${newSkin}/skin.min.css`
    );
  }, [tinymceRef, newSkin, oldSkin]);

  useEffect(() => {
    const event = AppEventManager.subscribe(
      AppEvents.UPDATE_ATTACHMENT_PROGRESS,
      (progressState) => {
        if (!tinymceRef.current.editor._updateAttachmentProgress) return;
        tinymceRef.current.editor._updateAttachmentProgress(progressState);
      }
    );

    const mediaAttachmentDownloadedEvent = EV.subscribe(
      EVENTS.mediaAttachmentDownloaded,
      (image) => {
        const { groupId, hash, src } = image;
        if (groupId?.startsWith("monograph")) return;
        tinymceRef.current.editor._replaceImage({ hash, src });
      }
    );
    return () => {
      event.unsubscribe();
      mediaAttachmentDownloadedEvent.unsubscribe();
    };
  }, [tinymceRef]);

  return (
    <Editor
      id={sessionId}
      ref={tinymceRef}
      onFocus={onFocus}
      onDrop={async (e, editor) => {
        for (let file of e.dataTransfer.files) {
          await attachFile(editor, file);
        }
      }}
      init={{
        //experimental
        keep_styles: ["font-family", "text-align"],
        keep_elements: { SPAN: true },

        menubar: false,
        statusbar: false,
        link_quicklink: true,
        width: "100%",
        plugins: [
          plugins.default,
          plugins.custom,
          isUserPremium ? plugins.pro : "",
        ],
        toolbar_mode: isTablet() ? "scrolling" : "sliding",
        contextmenu: false,
        skin_url: newSkin,
        inline_boundaries_selector: "a[href]",
        toolbar: simple
          ? false
          : `bold italic underline strikethrough inlinecode | fontselect | blockquote codeblock | fontsizeselect formatselect | alignleft aligncenter alignright alignjustify | outdent indent subscript superscript |  numlist bullist checklist | forecolor backcolor removeformat | hr | image attachment media link table | ltr rtl | searchreplace`,
        font_formats:
          "Serif=serif; Classic=courier new; Monospace=courier; System font=Open Sans",
        quickbars_selection_toolbar: false,
        link_context_toolbar: true,
        mobile: {
          toolbar_mode: "scrolling",
        },
        block_formats:
          "Paragraph=p; Header 1=h1; Header 2=h2; Header 3=h3; Header 4=h4; Header 5=h5; Header 6=h6; Code=pre",
        textpattern_patterns: markdownPatterns,
        placeholder: placeholder || "Start writing your note here...",
        target_list: false,
        link_title: false,
        imagetools_toolbar:
          "rotateleft rotateright | flipv fliph | alignleft aligncenter alignright",
        init_instance_callback: (editor) => {
          onInit && onInit(editor);
        },
        setup: (editor) => {
          addPickerPlugin(global.tinymce);

          function onTap(e) {
            if (
              e.target.classList.contains("mce-content-body") &&
              !e.target.innerText.length > 0
            ) {
              e.preventDefault();
            }
          }

          const onEditorChange = async (e) => {
            if (
              e.type === "execcommand" &&
              ignoredCommand.includes(e.command.toLowerCase())
            )
              return;

            if (!editor.getHTML) return;
            const html = await editor.getHTML();
            onChange(html, editor);
          };

          function onScrollIntoView(e) {
            e.preventDefault();
            e.elm.scrollIntoView({
              behavior: "smooth",
              block: "nearest",
            });
          }

          function onKeyUp(e) {
            if (e.key !== "Backspace" && e.key !== "Enter") return;
            if (!editor.getHTML) return;

            editor.getHTML().then((html) => {
              onChange(html, editor);
            });
          }

          /**
           *
           * @param {ClipboardEvent} e
           */
          async function onPaste(e) {
            if (e.clipboardData?.items?.length) {
              for (let item of e.clipboardData.items) {
                const file = item.getAsFile();
                if (!file) continue;
                e.preventDefault();
                await attachFile(editor, file);
              }
            }
          }

          editor.onEditorChange = onEditorChange;
          editor.on("ScrollIntoView", onScrollIntoView);
          editor.on("tap", onTap);
          editor.on(changeEvents, onEditorChange);
          editor.on("keyup", onKeyUp);
          editor.on("paste", onPaste);
        },
        toolbar_persist: true,
        toolbar_sticky: false,
        browser_spellcheck: true,
        inline: true,
        fixed_toolbar_container: "#editorToolbar",
        paste_postprocess: async function (_, args) {
          const { node } = args;
          const editor = tinymceRef.current.editor || args.target;
          if (!editor || !editor.dom) return;
          processPastedContent(editor, node);
        },
        invalid_styles: {
          span: "--progress",
        },
        extended_valid_elements: `img[*|src=/placeholder.svg]`,
        attachmenthandler_download_attachment: async (hash) => {
          await downloadAttachment(hash);
        },
        table_tab_navigation: true,
        table_responsive_width: false,
        table_column_resizing: "resizetable",
        table_sizing_mode: "fixed",
        table_advtab: false,
        table_cell_advtab: false,
        table_row_advtab: false,
        table_col_advtab: false,
      }}
      onBeforeExecCommand={async (command) => {
        const isPremiumCommand = premiumCommands.some((cmd) => {
          const { value, command: commandName } = command;
          let isPremium = commandName === cmd && !value?.paste;
          if (commandName === "mceInsertContent" && !value?.paste) {
            isPremium = /^<(?:pre|table|img)|tox-checklist/gm.test(value);
          }
          return isPremium;
        });
        if (isPremiumCommand && !isUserPremium) {
          command.preventDefault();
          command.stopImmediatePropagation();
          command.stopPropagation();
          showToast(
            "error",
            "Upgrade to Pro to enjoy full rich text editor with markdown support.",
            [
              {
                text: "Upgrade",
                onClick: () => {
                  showBuyDialog();
                },
              },
            ]
          );
          return;
        }
      }}
      onKeyDown={(e) => {
        e.stopPropagation();
        if (e.ctrlKey && e.key === "s") {
          e.preventDefault();
          onSave();
        }
      }}
    />
  );
}

export default React.memo(TinyMCE, () => true);
