import 'tinymce/tinymce';
import 'tinymce/icons/default';
import 'tinymce/themes/silver';
import 'tinymce/plugins/autoresize';
import 'tinymce/plugins/wordcount';
import 'tinymce/plugins/table';
import 'tinymce/plugins/media';
import 'tinymce/plugins/searchreplace';
import 'tinymce/plugins/image';
import 'tinymce/plugins/link';
import 'tinymce/plugins/lists';
import 'tinymce/plugins/autolink';
import 'tinymce/plugins/advlist';
import 'tinymce/plugins/imagetools';
import 'tinymce/plugins/directionality';
import 'tinymce/plugins/hr';
import 'tinymce/plugins/noneditable';
import 'tinymce/plugins/textpattern';
import { processPastedContent } from '@streetwriters/tinymce-plugins/codeblock';
import '@streetwriters/tinymce-plugins/codeblock';
import '@streetwriters/tinymce-plugins/checklist';
import '@streetwriters/tinymce-plugins/paste';
import '@streetwriters/tinymce-plugins/inlinecode';
import '@streetwriters/tinymce-plugins/keyboardquirks';
import '@streetwriters/tinymce-plugins/attachmentshandler';
import '@streetwriters/tinymce-plugins/blockescape';
import '@streetwriters/tinymce-plugins/contenthandler';
import '@streetwriters/tinymce-plugins/bettertable';
import '@streetwriters/tinymce-plugins/collapsibleheaders';

require.context(
  'file-loader?name=[path][name].[ext]&context=node_modules/tinymce!tinymce/skins',
  true,
  /.*/
);
global.processPastedContent = processPastedContent;
global.current_selection_range = null;
global.editor = null;
