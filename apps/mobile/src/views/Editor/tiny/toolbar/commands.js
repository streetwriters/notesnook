import React from 'react';
import {Platform, View} from 'react-native';
import DocumentPicker from 'react-native-document-picker';
import Sodium from 'react-native-sodium';
import {launchCamera, launchImageLibrary} from 'react-native-image-picker';
import RNFetchBlob from 'rn-fetch-blob';
import {Attachment} from '../../../../components/AttachmentDialog';
import {eSendEvent, ToastEvent} from '../../../../services/EventManager';
import {editing} from '../../../../utils';
import {db} from '../../../../utils/database';
import {
  eCloseProgressDialog,
  eOpenProgressDialog
} from '../../../../utils/Events';
import {sleep} from '../../../../utils/TimeUtils';
import {EditorWebView, getNote} from '../../Functions';
import tiny, {safeKeyboardDismiss} from '../tiny';

const FILE_SIZE_LIMIT = 500 * 1024 * 1024;
const IMAGE_SIZE_LIMIT = 50 * 1024 * 1024;

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
  forecolor: color =>
    `tinymce.activeEditor.execCommand('ForeColor',false, '${color}');`,
  hilitecolor: color =>
    `tinymce.activeEditor.execCommand('HiliteColor',false, '${color}');`,
  dforecolor: color =>
    `tinymce.activeEditor.execCommand('ForeColor',false, '${color}');`,
  dhilitecolor: color =>
    `tinymce.activeEditor.execCommand('HiliteColor',false, '${color}');`,

  fontname: fontname =>
    `tinymce.activeEditor.execCommand('FontName',false, '${fontname}');`,

  indent: `tinymce.activeEditor.execCommand('Indent');`,
  outdent: `tinymce.activeEditor.execCommand('Outdent');`,
  blockquote: `tinymce.activeEditor.execCommand('mceBlockQuote');`,
  link: link =>
    `tinymce.activeEditor.execCommand('mceInsertLink',false, '${link}');`,
  unlink: `tinymce.activeEditor.execCommand('Unlink')`,
  fontsize: size =>
    `tinymce.activeEditor.execCommand('FontSize', false, '${size}');`,
  removeformat: `tinymce.activeEditor.execCommand('RemoveFormat');`,
  p: `tinymce.activeEditor.execCommand('FormatBlock', false, 'p');`,
  h2: `tinymce.activeEditor.execCommand('FormatBlock', false, 'h2');`,
  h3: `tinymce.activeEditor.execCommand('FormatBlock', false, 'h3');`,
  h4: `tinymce.activeEditor.execCommand('FormatBlock', false, 'h4');`,
  h5: `tinymce.activeEditor.execCommand('FormatBlock', false, 'h5');`,
  h6: `tinymce.activeEditor.execCommand('FormatBlock', false, 'h6');`,
  pre: `tinymce.activeEditor.execCommand('FormatBlock', false, 'pre');`,
  ol: style =>
    `tinymce.activeEditor.execCommand('InsertOrderedList', false, {'list-style-type': "${style}"});`,
  ul: style =>
    `tinymce.activeEditor.execCommand('InsertUnorderedList', false, {'list-style-type': "${style}"});`,
  removeList: `tinymce.activeEditor.execCommand('RemoveList');`,
  horizontal: `tinymce.activeEditor.execCommand('InsertHorizontalRule');`,
  rtl: `tinymce.activeEditor.execCommand('mceDirectionRTL');`,
  ltr: `tinymce.activeEditor.execCommand('mceDirectionLTR');`,
  magnify: `
  tinymce.activeEditor.execCommand('SearchReplace');
  setTimeout(function() {
    document.querySelector(".tox-textfield").focus()
  },100)
  `,
  table: (r, c) =>
    `(function() {
      let body = tinymce.activeEditor.contentDocument.getElementsByTagName("body")[0];
      
      if (body.lastElementChild && body.lastElementChild.innerHTML === tinymce.activeEditor.selection.getNode().innerHTML) {
        let rng = tinymce.activeEditor.selection.getRng()
        tinymce.activeEditor.execCommand("mceInsertNewLine")
        tinymce.activeEditor.nodeChanged({selectionChange:true})
        tinymce.activeEditor.selection.setRng(rng)
     }  
     editor.undoManager.transact(function() {
      tinymce.activeEditor.execCommand('mceInsertTable', false, { rows: ${r}, columns: ${c} }); 
     }); 
     
    })();`,

  cl: `tinymce.activeEditor.execCommand('insertCheckList')`,
  filepicker: async () => {
    try {
      let options = {
        mode: 'import',
        allowMultiSelection: false
      };
      if (Platform.OS == 'ios') {
        options.copyTo = 'cachesDirectory';
      }

      let key = await db.attachments.generateKey();

      console.log('generated key for attachments: ', key);

      let file = await DocumentPicker.pick(options);
      file = file[0];
      if (file.size > FILE_SIZE_LIMIT) {
        ToastEvent.show({
          title: 'File too large',
          message: 'The maximum allowed size per file is 512 MB',
          type:'error'
        });
        return;
      }

      if (file.copyError) {
        ToastEvent.show({
          heading: 'Failed to open file',
          message: file.copyError,
          type: 'error',
          context: 'global'
        });
        return;
      }

      let uri =
        Platform.OS === 'ios'
          ? file.fileCopyUri.replace('file:///', '/')
          : file.uri;

      eSendEvent(eOpenProgressDialog, {
        title: 'Encrypting attachment',
        paragraph: 'Please wait while we encrypt file for upload',
        nowarn: true,
        icon: 'attachment',
        component: (
          <View
            style={{
              paddingHorizontal: 12
            }}>
            <Attachment
              attachment={{
                metadata: {
                  filename: file.name
                },
                length: file.size
              }}
              encryption
            />
          </View>
        )
      });

      let hash = await Sodium.hashFile({
        uri: uri,
        type: 'url'
      });
      console.log(hash);
      let result = await attachFile(uri, hash, file.type, file.name);
      console.log('attach file: ', result);
      if (Platform.OS === 'ios') {
        await RNFetchBlob.fs.unlink(uri);
      }
      setTimeout(() => {
        eSendEvent(eCloseProgressDialog);
      }, 1000);
      if (!result) return;
      tiny.call(
        EditorWebView,
        `
    (function() {
      let file = ${JSON.stringify({
        hash: hash,
        filename: file.name,
        type: file.type,
        size: file.size
      })}
      tinymce.activeEditor.execCommand('mceAttachFile',file);
      setTimeout(function() {
        tinymce.activeEditor.nodeChanged({selectionChange:true})
      },100)
    })();
    `
      );
    } catch (e) {
      ToastEvent.show({
        heading: e.message,
        message: 'You need internet access to attach a file',
        type: 'error',
        context: 'global'
      });
      console.log('attachment error: ', e);
    }
  },
  image: async () => {
    if (editing.isFocused) {
      safeKeyboardDismiss();
      await sleep(500);
      editing.isFocused = true;
    }
    eSendEvent(eOpenProgressDialog, {
      noProgress: true,
      noIcon: true,
      actionsArray: [
        {
          action: async () => {
            try {
              let key = await db.attachments.generateKey();
              eSendEvent(eCloseProgressDialog);
              await sleep(400);
              launchCamera(
                {
                  includeBase64: true,
                  maxWidth: 4000,
                  maxHeight: 4000,
                  quality: 0.8,
                  mediaType: 'photo'
                },
                handleImageResponse
              );
            } catch (e) {
              ToastEvent.show({
                heading: e.message,
                message: 'You need internet access to attach a file',
                type: 'error',
                context: 'global'
              });
              console.log('attachment error:', e);
            }
          },
          actionText: 'Take photo',
          icon: 'camera'
        },
        {
          action: async () => {
            try {
              let key = await db.attachments.generateKey();

              eSendEvent(eCloseProgressDialog);
              await sleep(400);
              launchImageLibrary(
                {
                  includeBase64: true,
                  maxWidth: 4000,
                  maxHeight: 4000,
                  quality: 0.8,
                  mediaType: 'photo',
                  selectionLimit: 1
                },
                handleImageResponse
              );
            } catch (e) {
              ToastEvent.show({
                heading: e.message,
                message: 'You need internet access to attach a file',
                type: 'error',
                context: 'global'
              });
              console.log('attachment error:', e);
            }
          },
          actionText: 'Select from gallery',
          icon: 'image-multiple'
        }
      ]
    });

    return;
  },
  video: `tinymce.activeEditor.execCommand('mceMedia')`,
  pre: `
    tinymce.activeEditor.execCommand('mceInsertCodeBlock')
  `,
  tableprops: "tinymce.activeEditor.execCommand('mceTableProps');",
  tabledelete: "tinymce.activeEditor.execCommand('mceTableDelete');",
  tablesplitcell: "tinymce.activeEditor.execCommand('mceTableSplitCells');",
  tablemergecell: "tinymce.activeEditor.execCommand('mceTableMergeCells');",
  tablerowprops: "tinymce.activeEditor.execCommand('mceTableRowProps');",
  imageResize25: () => setImageSize(0.25),
  imageResize50: () => setImageSize(0.5),
  imageResize100: () => setImageSize(1),
  imagepreview: `(function() {
    if (tinymce.activeEditor.selection.getNode().tagName === 'IMG') {
      var xhr = new XMLHttpRequest();
      xhr.responseType = 'blob';
  
      xhr.onload = function () {
        var recoveredBlob = xhr.response;
        var reader = new FileReader();
        reader.onload = function () {
          var blobAsDataUrl = reader.result;
          window.ReactNativeWebView.postMessage(
            JSON.stringify({
              type: 'imagepreview',
              value: blobAsDataUrl
            })
          );
          reader.abort();
          xhr.abort();
        };
        reader.readAsDataURL(recoveredBlob);
      };
      xhr.open(
        'GET',
        tinymce.activeEditor.selection.getNode().getAttribute('src')
      );
      xhr.send();
    }
  })();
  `,
  removeimage: `
  (function() {
    if (tinymce.activeEditor.selection.getNode().tagName === 'IMG') {
    tinymce.activeEditor.undoManager.transact(function() {tinymce.activeEditor.execCommand('Delete');});
    setTimeout(function() {
      tinymce.activeEditor.nodeChanged({selectionChange:true})
    },100)
    }  
  })();
  `,
  imagefloatleft: () => setFloat('left'),
  imagefloatright: () => setFloat('right'),
  imagefloatnone: () => setFloat('none'),
  'line-break': `
  tinymce.activeEditor.undoManager.transact(function() {
    tinymce.activeEditor.execCommand('InsertLineBreak');
  });`,
  code: `tinymce.activeEditor.undoManager.transact(function() {
    tinymce.activeEditor.execCommand('mceInsertInlineCode');
});`
};

const handleImageResponse = async response => {
  if (
    response.didCancel ||
    response.errorMessage ||
    !response.assets ||
    response.assets?.length === 0
  ) {
    return;
  }

  let image = response.assets[0];
  if (image.fileSize > IMAGE_SIZE_LIMIT) {
    ToastEvent.show({
      title: 'File too large',
      message: 'The maximum allowed size per image is 50 MB',
      type:'error'
    });
    return;
  }
  let b64 = `data:${image.type};base64, ` + image.base64;
  let options;
  if (Platform.OS === 'android') {
    options = {
      uri: image.uri,
      type: 'url'
    };
  } else {
    options = {
      data: image.base64,
      type: 'base64'
    };
  }

  let hash = await Sodium.hashFile(options);
  console.log(hash);
  tiny.call(
    EditorWebView,
    `
    (function(){
      let image = ${JSON.stringify({
        hash: hash,
        type: image.type,
        filename: image.fileName,
        dataurl: b64,
        size: image.fileSize
      })}
      tinymce.activeEditor.execCommand('mceAttachImage',image);
      setTimeout(function() {
        tinymce.activeEditor.nodeChanged({selectionChange:true})
      },100)
    })();
    `
  );
  attachFile(
    image.uri,
    hash,
    image.type,
    image.fileName,
    Platform.OS === 'ios' ? image.base64 : null
  );
};

async function attachFile(uri, hash, type, filename, b64) {
  try {
    let exists = db.attachments.exists(hash);
    let encryptionInfo;
    if (!exists) {
      let key = await db.attachments.generateKey();
      let options = {
        hash: hash
      };
      if (Platform.OS === 'ios' && b64) {
        options.data = b64;
        options.type = 'base64';
      } else {
        options.uri = uri;
        options.type = 'url';
      }

      encryptionInfo = await Sodium.encryptFile(key, options);
      encryptionInfo.type = type;
      encryptionInfo.filename = filename;
      encryptionInfo.alg = `xcha-argon2i13-s`;
      encryptionInfo.size = encryptionInfo.length;
      encryptionInfo.key = key;
    } else {
      encryptionInfo = {hash: hash};
    }
    console.log(encryptionInfo);
    await db.attachments.add(encryptionInfo, getNote()?.id);
    return true;
  } catch (e) {
    console.log('attach file error: ', e);
    return false;
  }
}

const setFloat = float => `(function () {
  let node = tinymce.activeEditor.selection.getNode();
  if (node.tagName === 'IMG') {
    tinymce.activeEditor.undoManager.transact(function() {
      node.style.float = "${float}";
      setTimeout(function() {
        tinymce.activeEditor.nodeChanged({selectionChange:true})
      },100)
    });
  }
  })()`;

const setImageSize = size => `(function() {
  let node = tinymce.activeEditor.selection.getNode();
if (tinymce.activeEditor.selection.getNode().tagName === 'IMG') {
  tinymce.activeEditor.undoManager.transact(function() { 
  let rect = node.getBoundingClientRect();
    let originalWidth = rect.width;
    let originalHeight = rect.height;
    if (node.dataset.width) {
      originalWidth = node.dataset.width;
      originalHeight = node.dataset.height;
    } else {
      node.dataset.width = originalWidth;
      node.dataset.height = originalHeight;
    }

    node.width = originalWidth * ${size}
    setTimeout(function() {
      tinymce.activeEditor.nodeChanged({selectionChange:true})
    },100)
  });
}
})();
`;
