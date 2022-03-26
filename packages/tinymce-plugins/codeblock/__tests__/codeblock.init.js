import "../../paste/index.js";
import { processPastedContent } from "../index.js";

tinymce.init({
  selector: "#mytextarea",
  plugins: "codeblock paste",
  toolbar: "codeblock",
  content_style: `pre code.hljs{display:block;overflow-x:auto;padding:1em}code.hljs{padding:3px 5px}.hljs{background:#f0f0f0;color:#444}.hljs-comment{color:#888}.hljs-punctuation,.hljs-tag{color:#444a}.hljs-tag .hljs-attr,.hljs-tag .hljs-name{color:#444}.hljs-attribute,.hljs-doctag,.hljs-keyword,.hljs-meta .hljs-keyword,.hljs-name,.hljs-selector-tag{font-weight:700}.hljs-deletion,.hljs-number,.hljs-quote,.hljs-selector-class,.hljs-selector-id,.hljs-string,.hljs-template-tag,.hljs-type{color:#800}.hljs-section,.hljs-title{color:#800;font-weight:700}.hljs-link,.hljs-operator,.hljs-regexp,.hljs-selector-attr,.hljs-selector-pseudo,.hljs-symbol,.hljs-template-variable,.hljs-variable{color:#bc6060}.hljs-literal{color:#78a960}.hljs-addition,.hljs-built_in,.hljs-bullet,.hljs-code{color:#397300}.hljs-meta{color:#1f7199}.hljs-meta .hljs-string{color:#4d99bf}.hljs-emphasis{font-style:italic}.hljs-strong{font-weight:700}`,
  height: "500px",
  paste_postprocess: async function(_, args) {
    const { node } = args;
    const editor = args.target;
    if (!editor || !editor.dom) return;
    processPastedContent(editor, node);
  },
});
