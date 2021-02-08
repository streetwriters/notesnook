import {Platform} from 'react-native';
import { eSendEvent } from '../../../../services/EventManager';
import {EditorWebView} from '../../Functions';
import tiny from '../tiny';

export const properties = {
  selection: {},
  pauseSelectionChange: false,
  inputMode: 1,
  userBlur: false,
};

export function formatSelection(command) {
  EditorWebView.current?.injectJavaScript(command);
}

export function focusEditor(format) {

  eSendEvent("showTooltip");
  Platform.OS === 'android' && EditorWebView.current.requestFocus();
  if (format === 'link' || format === 'video') {
    tiny.call(EditorWebView, tiny.blur + ' ' + tiny.focusEditor);
  } else {
    tiny.call(EditorWebView, tiny.focusEditor);
  }
}

export function rgbToHex(color) {
  color = '' + color;
  if (!color || color.indexOf('rgb') < 0) {
    return;
  }

  if (color.charAt(0) == '#') {
    return color;
  }

  var nums = /(.*?)rgb\((\d+),\s*(\d+),\s*(\d+)\)/i.exec(color),
    r = parseInt(nums[2], 10).toString(16),
    g = parseInt(nums[3], 10).toString(16),
    b = parseInt(nums[4], 10).toString(16);

  return (
    '#' +
    ((r.length == 1 ? '0' + r : r) +
      (g.length == 1 ? '0' + g : g) +
      (b.length == 1 ? '0' + b : b))
  );
}

export const INPUT_MODE = {
  EDITING: 1,
  NO_EDIT: 2,
};

export const font_names = Platform.select({
  android: [
    {name: 'System Font', value: ''},
    {name: 'Times New Roman', value: 'times new roman'},
    {name: 'Serif', value: 'serif'},
    {name: 'Sans', value: 'sans-serif'},
    {name: 'Mono', value: 'courier'},
    {name: 'Classic', value: 'courier new'},
  ],
  ios: [
    {name: 'System Font', value: ''},
    {name: 'Sans', value: '-apple-system'},
    {name: 'Times New Roman', value: 'times new roman'},
    {name: 'Mono', value: 'courier'},
    {name: 'Classic', value: 'courier new'},
  ],
});

export const editor_colors = [
  '#000000',
  '#e60000',
  '#ff9900',
  '#ffff00',
  '#008a00',
  '#0066cc',
  '#9933ff',
  '#ffffff',
  '#facccc',
  '#ffebcc',
  '#ffffcc',
  '#cce8cc',
  '#cce0f5',
  '#ebd6ff',
  '#bbbbbb',
  '#f06666',
  '#ffc266',
  '#ffff66',
  '#66b966',
  '#66a3e0',
  '#c285ff',
  '#888888',
  '#a10000',
  '#b26b00',
  '#b2b200',
  '#006100',
  '#0047b2',
  '#6b24b2',
  '#444444',
  '#5c0000',
  '#663d00',
  '#666600',
  '#003700',
  '#002966',
  '#3d1466',
];

export const editor_font_size = [
  '8pt',
  '10pt',
  '12pt',
  '14pt',
  '18pt',
  '24pt',
  '36pt',
];

export const unorderedListStyles = ['default', 'circle', 'square'];

export const orderedListStyles = [
  'default',
  'lower-alpha',
  'lower-greek',
  'lower-roman',
  'upper-alpha',
  'upper-roman',
];

export const TOOLBAR_ICONS = {
  bold: 'format-bold',
  alignleft: 'format-align-left',
  alignright: 'format-align-right',
  aligncenter: 'format-align-center',
  alignjustify: 'format-align-justify',
  italic: 'format-italic',
  strikethrough: 'format-strikethrough',
  underline: 'format-underline',
  superscript: 'format-superscript',
  subscript: 'format-subscript',
  blockquote: 'format-quote-open',
  indent: 'format-indent-increase',
  outdent: 'format-indent-decrease',
  rtl: 'format-textdirection-r-to-l',
  ltr: 'format-textdirection-l-to-r',
  link: 'link',
  'code-block': 'code-braces',
  image: 'image',
  video: 'video',
  ul: 'format-list-bulleted',
  ol: 'format-list-numbered',
  cl: 'format-list-checkbox',
  hilitecolor: 'format-color-highlight',
  forecolor: 'format-color-text',
  p: 'format-paragraph',
  h2: 'format-header-2',
  h3: 'format-header-3',
  h4: 'format-header-4',
  h5: 'format-header-5',
  h6: 'format-header-6',
  fontsize: 'format-font-size-increase',
  removeformat: 'format-clear',
  horizontal: 'border-horizontal',
  table: 'table-plus',
  settings:'cog-outline'
};
