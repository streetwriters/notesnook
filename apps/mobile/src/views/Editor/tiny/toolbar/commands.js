import DocumentPicker from 'react-native-document-picker';
import {launchCamera, launchImageLibrary} from 'react-native-image-picker';
import {eSendEvent} from '../../../../services/EventManager';
import {editing} from '../../../../utils';
import {
  eCloseProgressDialog,
  eOpenProgressDialog,
} from '../../../../utils/Events';
import {sleep} from '../../../../utils/TimeUtils';
import {EditorWebView} from '../../Functions';
import tiny from '../tiny';
import {formatSelection} from './constants';
let RNFetchBlob;

export const execCommands = {
  bold: `tinymce.activeEditor.execCommand('Bold');`,
  alignleft: `tinymce.activeEditor.execCommand('JustifyLeft');`,
  alignright: `tinymce.activeEditor.execCommand('JustifyRight');`,
  aligncenter: `tinymce.activeEditor.execCommand('JustifyCenter');`,
  alignjustify: `tinymce.activeEditor.execCommand('JustifyFull');`,
  italic: `tinymce.activeEditor.execCommand('Italic');`,
  strikethrough: `tinymce.activeEditor.execCommand('Strikethrough');`,
  underline: `tinymce.activeEditor.execCommand('Underline');`,
  superscript: `tinymce.activeEditor.execCommand('Superscript');`,
  subscript: `tinymce.activeEditor.execCommand('Subscript');`,
  forecolor: (color) =>
    `tinymce.activeEditor.execCommand('ForeColor',false, '${color}');`,
  hilitecolor: (color) =>
    `tinymce.activeEditor.execCommand('HiliteColor',false, '${color}');`,

  fontname: (fontname) =>
    `tinymce.activeEditor.execCommand('FontName',false, '${fontname}');`,

  indent: `tinymce.activeEditor.execCommand('Indent');`,
  outdent: `tinymce.activeEditor.execCommand('Outdent');`,
  blockquote: `tinymce.activeEditor.execCommand('mceBlockQuote');`,
  link: (link) =>
    `tinymce.activeEditor.execCommand('mceInsertLink',false, '${link}');`,
  unlink: `tinymce.activeEditor.execCommand('Unlink')`,
  fontsize: (size) =>
    `tinymce.activeEditor.execCommand('FontSize', false, '${size}');`,
  removeformat: `tinymce.activeEditor.execCommand('RemoveFormat');`,
  p: `tinymce.activeEditor.execCommand('FormatBlock', false, 'p');`,
  h2: `tinymce.activeEditor.execCommand('FormatBlock', false, 'h2');`,
  h3: `tinymce.activeEditor.execCommand('FormatBlock', false, 'h3');`,
  h4: `tinymce.activeEditor.execCommand('FormatBlock', false, 'h4');`,
  h5: `tinymce.activeEditor.execCommand('FormatBlock', false, 'h5');`,
  h6: `tinymce.activeEditor.execCommand('FormatBlock', false, 'h6');`,
  pre: `tinymce.activeEditor.execCommand('FormatBlock', false, 'pre');`,
  ol: (style) =>
    `tinymce.activeEditor.execCommand('InsertOrderedList', false, {'list-style-type': "${style}"});`,
  ul: (style) =>
    `tinymce.activeEditor.execCommand('InsertUnorderedList', false, {'list-style-type': "${style}"});`,
  removeList: `tinymce.activeEditor.execCommand('RemoveList');`,
  horizontal: `tinymce.activeEditor.execCommand('InsertHorizontalRule');`,
  rtl: `tinymce.activeEditor.execCommand('mceDirectionRTL');`,
  ltr: `tinymce.activeEditor.execCommand('mceDirectionLTR');`,
  table: (r, c) =>
    `tinymce.activeEditor.execCommand('mceInsertTable', false, { rows: ${r}, columns: ${c} })`,
  cl: `tinymce.activeEditor.execCommand('InsertCheckList')`,
  image: async () => {
    if (editing.isFocused) {
      tiny.call(EditorWebView, tiny.blur);
      await sleep(500);
      editing.isFocused = true;
    }
    eSendEvent(eOpenProgressDialog, {
      noProgress: true,
      noIcon: true,
      actionsArray: [
        {
          action: async () => {
            eSendEvent(eCloseProgressDialog);
            await sleep(300);
            launchCamera(
              {
                includeBase64: true,
                maxWidth: 1024,
                mediaType: 'photo',
              },
              (response) => {
                if (response.didCancel || response.errorMessage) {
                  return;
                }
                console.log(
                  response.type,
                  response.errorCode,
                  response.errorMessage,
                );
                let b64 = `data:${response.type};base64, ` + response.base64;
                formatSelection(`
              minifyImg(
                "${b64}",
                1024,
                'image/jpeg',
                (r) => {
                  var content = "<img style=" + "max-width:100% !important;" + "src=" + r + ">";
                  editor.undoManager.transact(() => editor.execCommand("mceInsertContent",false,content)); 
                },
                0.6,
              );
              `);
              },
            );
          },
          actionText: 'Take photo',
          icon: 'camera',
        },
        {
          action: async () => {
            eSendEvent(eCloseProgressDialog);
            await sleep(300);
            launchImageLibrary(
              {
                includeBase64: true,
                maxWidth: 1024,
                mediaType: 'photo',
              },
              (response) => {
                if (response.didCancel || response.errorMessage) {
                  return;
                }
                console.log(
                  response.type,
                  response.errorCode,
                  response.errorMessage,
                );
                let b64 = `data:${response.type};base64, ` + response.base64;
                formatSelection(`
              minifyImg(
                "${b64}",
                1024,
                'image/jpeg',
                (r) => {
                  var content = "<img style=" + "max-width:100% !important;" + "src=" + r + ">";
                  editor.undoManager.transact(() => editor.execCommand("mceInsertContent",false,content)); 
                },
                0.6,
              );
              `);
              },
            );
          },
          actionText: 'Select from gallery',
          icon: 'image-multiple',
        },
      ],
    });

    return;
  },
  video: `tinymce.activeEditor.execCommand('mceMedia')`,
  pre: `
    tinymce.activeEditor.execCommand('CodeBlock')
  `,
};
