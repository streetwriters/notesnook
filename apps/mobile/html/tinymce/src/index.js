import "tinymce/tinymce";
import "tinymce/icons/default";
import "tinymce/themes/silver";
import "tinymce/plugins/autoresize";
import "tinymce/plugins/wordcount";
import "tinymce/plugins/table";
import "tinymce/plugins/media";
import "tinymce/plugins/searchreplace";
import "tinymce/plugins/image";
import "tinymce/plugins/link";
import "tinymce/plugins/lists";
import "tinymce/plugins/autolink";
import "tinymce/plugins/advlist";
import "tinymce/plugins/imagetools";
import "tinymce/plugins/directionality";
import "tinymce/plugins/hr";
import "tinymce/plugins/noneditable";
import "tinymce/plugins/textpattern";
import {processPastedContent} from "@streetwritersco/tinymce-plugins/codeblock";
import "@streetwritersco/tinymce-plugins/codeblock";
import "@streetwritersco/tinymce-plugins/checklist";
import "@streetwritersco/tinymce-plugins/paste";
import "@streetwritersco/tinymce-plugins/inlinecode"
import "@streetwritersco/tinymce-plugins/keyboardquirks";
import "@streetwritersco/tinymce-plugins/attachmentshandler";
import "@streetwritersco/tinymce-plugins/blockescape";

require.context(
  "file-loader?name=[path][name].[ext]&context=node_modules/tinymce!tinymce/skins",
  true,
  /.*/
);
global.processPastedContent = processPastedContent;
global.current_selection_range = null;
global.editor = null;
