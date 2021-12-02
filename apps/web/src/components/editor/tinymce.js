import React, { useEffect } from "react";
import "./editor.css";
import "@streetwritersco/tinymce-plugins/codeblock/styles.css";
import "@streetwritersco/tinymce-plugins/collapsibleheaders/styles.css";
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
import { processPastedContent } from "@streetwritersco/tinymce-plugins/codeblock";
import "@streetwritersco/tinymce-plugins/inlinecode";
import "@streetwritersco/tinymce-plugins/shortlink";
import "@streetwritersco/tinymce-plugins/checklist";
import "@streetwritersco/tinymce-plugins/collapsibleheaders";
import "@streetwritersco/tinymce-plugins/paste";
import "@streetwritersco/tinymce-plugins/shortcuts";
import "@streetwritersco/tinymce-plugins/keyboardquirks";
import "@streetwritersco/tinymce-plugins/attachmentshandler";
import "@streetwritersco/tinymce-plugins/contenthandler";
import "./plugins/picker";
import "./plugins/icons";
import "./plugins/attachmentshandler.css";
import "@streetwritersco/tinymce-plugins/blockescape";
import { Editor } from "@tinymce/tinymce-react";
import { showBuyDialog } from "../../common/dialog-controller";
import { useStore as useThemeStore } from "../../stores/theme-store";
import { isTablet } from "../../utils/dimensions";
import { showToast } from "../../utils/toast";
import { useIsUserPremium } from "../../hooks/use-is-user-premium";
import { AppEventManager, AppEvents } from "../../common";
import { EV, EVENTS } from "notes-core/common";
import { downloadAttachment } from "../../common/attachments";
import debounce from "just-debounce";

const markdownPatterns = [
  { start: "```", replacement: "<pre></pre>" },
  { start: "*", end: "*", format: "italic" },
  { start: "_", end: "_", format: "italic" },
  { start: "**", end: "**", format: "bold" },
  { start: "~~", end: "~~", format: "strikethrough" },
  { start: "`", end: "`", cmd: "mceInsertInlineCode" },
  { start: "## ", format: "h2" },
  { start: "### ", format: "h3" },
  { start: "#### ", format: "h4" },
  { start: "##### ", format: "h5" },
  { start: "###### ", format: "h6" },
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
    "contenthandler icons blockescape keyboardquirks collapsibleheaders shortlink paste codeblock inlinecode checklist attachmentshandler",
  pro: "textpattern picker",
};

const changeEvents = "change input compositionend paste";

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
      initialValue={initialValue}
      init={{
        //experimental
        keep_styles: false,

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
          "Paragraph=p; Header 2=h2; Header 3=h3; Header 4=h4; Header 5=h5; Header 6=h6; Code=pre",
        textpattern_patterns: markdownPatterns,
        placeholder: placeholder || "Start writing your note here...",
        target_list: false,
        link_title: false,
        imagetools_toolbar:
          "rotateleft rotateright | flipv fliph | alignleft aligncenter alignright",
        init_instance_callback: (editor) => {
          editor.serializer.addTempAttr("data-progress");
          clearTimeout(editor.changeTimeout);
          onInit && onInit(editor);
          console.log("init");
        },
        setup: (editor) => {
          editor.on("tap", (e) => {
            if (
              e.target.classList.contains("mce-content-body") &&
              !e.target.innerText.length > 0
            ) {
              e.preventDefault();
            }
          });

          editor.on("ScrollIntoView", (e) => {
            e.preventDefault();
            e.elm.scrollIntoView({
              behavior: "smooth",
              block: "nearest",
            });
          });

          const onEditorChange = debounce(() => {
            if (onWordCountChanged) onWordCountChanged(editor.countWords());

            if (!editor.getHTML) return;

            editor.getHTML().then((html) => {
              onChange(html, editor);
            });
          }, changeInterval);

          editor.on(changeEvents, onEditorChange);
        },
        toolbar_persist: true,
        toolbar_sticky: false,
        browser_spellcheck: true,
        inline: true,
        fixed_toolbar_container: "#editorToolbar",
        paste_postprocess: function (_, args) {
          const { node } = args;
          processPastedContent(node);
        },
        invalid_styles: {
          span: "--progress",
        },
        extended_valid_elements: `img[*|src=/placeholder.svg]`,
        attachmenthandler_download_attachment: async (hash) => {
          await downloadAttachment(hash);
        },
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
        if (e.ctrlKey && e.key === "s") {
          e.preventDefault();
          onSave();
        }
      }}
    />
  );
}

export default React.memo(TinyMCE, () => true);
