import {createRef} from 'react';
import {Platform} from 'react-native';
import {eSendEvent} from '../../../../services/EventManager';
import {editing} from '../../../../utils';
import {sleep} from '../../../../utils/TimeUtils';
import {EditorWebView, textInput} from '../../Functions';
import tiny from '../tiny';

export const properties = {
  selection: {},
  pauseSelectionChange: false,
  inputMode: 1,
  userBlur: false,
  linkAdded: false
};

export const toolbarRef = createRef();

export function formatSelection(command) {
  EditorWebView.current?.injectJavaScript(command);
}

export async function focusEditor(format, kill = true) {
  kill && eSendEvent('showTooltip');
  Platform.OS === 'android' && EditorWebView.current.requestFocus();
  if (format === 'link' || format === 'video') {
    textInput.current?.focus();
    tiny.call(EditorWebView, tiny.focusEditor);
  } else {
    console.log('focus editor');
    Platform.OS === 'android' && EditorWebView.current?.requestFocus();
    tiny.call(EditorWebView, tiny.focusEditor);
  }
}

export async function reFocusEditor() {
  if (editing.isFocused === true) {
    if (Platform.OS === 'android') {
      await sleep(300);
      textInput.current?.focus();
    }
    await sleep(300);
    if (editing.focusType == 'editor') {
      focusEditor(null, false);
    } else {
      Platform.OS === 'android' && EditorWebView.current?.requestFocus();
      tiny.call(EditorWebView, tiny.focusTitle);
    }
  }
}

function trim(str) {
  return str.replace(/^\s+|\s+$/gm, '');
}

export function rgbToHex(color) {
  if (!color.startsWith('rgba')) {
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
  } else {
    let rgba = color;
    var inParts = rgba.substring(rgba.indexOf('(')).split(','),
      r = parseInt(trim(inParts[0].substring(1)), 10),
      g = parseInt(trim(inParts[1]), 10),
      b = parseInt(trim(inParts[2]), 10),
      a = parseFloat(
        trim(inParts[3].substring(0, inParts[3].length - 1))
      ).toFixed(2);
    var outParts = [
      r.toString(16),
      g.toString(16),
      b.toString(16),
      Math.round(a * 255)
        .toString(16)
        .substring(0, 2)
    ];

    // Pad single-digit output values
    outParts.forEach(function (part, i) {
      if (part.length === 1) {
        outParts[i] = '0' + part;
      }
    });

    return '#' + outParts.join('');
  }
}

export const INPUT_MODE = {
  EDITING: 1,
  NO_EDIT: 2
};

export const font_names = Platform.select({
  android: [
    {name: 'Sans', value: 'open sans'},
    {name: 'Serif', value: 'times new roman'},
    {name: 'Mono', value: 'courier'},
    {name: 'Classic', value: 'courier new'}
  ],
  ios: [
    {name: 'Sans Serif', value: 'open sans'},
    {name: 'Serif', value: 'times new roman'},
    {name: 'Mono', value: 'courier'},
    {name: 'Classic', value: 'courier new'}
  ]
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
  '#3d1466'
];

export const editor_font_size = [
  '8pt',
  '10pt',
  '12pt',
  '14pt',
  '18pt',
  '24pt',
  '36pt'
];

export const unorderedListStyles = ['default', 'circle', 'square'];

export const orderedListStyles = [
  'default',
  'lower-alpha',
  'lower-greek',
  'lower-roman',
  'upper-alpha',
  'upper-roman'
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
  pre: 'code-braces',
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
  settings: 'cog-outline',
  magnify: 'magnify',
  tableprops: 'table-settings',
  tabledelete: 'table-remove',
  tablesplitcell: 'table-split-cell',
  tablemergecell: 'table-merge-cells',
  tablerowprops: 'table-row',
  tablecolumnprops: 'table-column',
  tableconfig: 'table-cog',
  imagepreview: 'fullscreen',
  removeimage: 'delete',
  imagefloatleft: 'format-float-left',
  imagefloatright: 'format-float-right',
  imagefloatnone: 'format-float-none',
  'line-break': 'keyboard-return',
  code: 'code-tags',
  filepicker:'attachment',
  undo:'undo-variant',
  redo:'redo-variant'
};
