import DocumentPicker from 'react-native-document-picker';
import Sodium, {launchCamera, launchImageLibrary} from 'react-native-sodium';
import {eSendEvent} from '../../../../services/EventManager';
import {editing} from '../../../../utils';
import {db} from '../../../../utils/database';
import {
  eCloseProgressDialog,
  eOpenProgressDialog
} from '../../../../utils/Events';
import {sleep} from '../../../../utils/TimeUtils';
import {EditorWebView, getNote} from '../../Functions';
import tiny, {safeKeyboardDismiss} from '../tiny';

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
      let file = await DocumentPicker.pick();
      let hash = await Sodium.hashFile({
        uri: file.uri,
        type: 'url'
      });
      let result = await attachFile(file.uri, hash, file.type, file.name);
      if (!result) return;
      tiny.call(
        EditorWebView,
        `
    (function() {
      let file = ${JSON.stringify(attachment)}
      tinymce.activeEditor.execCommand('mceAttachFile',file);
      setTimeout(function() {
        tinymce.activeEditor.nodeChanged({selectionChange:true})
      },100)
    })();
    `
      );
    } catch (e) {
      console.log('filepicker: ', e);
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
            eSendEvent(eCloseProgressDialog);
            await sleep(400);
            launchCamera(
              {
                includeBase64: true,
                maxWidth: 2000,
                maxHeight: 2000,
                quality: 0.8,
                mediaType: 'photo',
                encryptToFile: false,
                ...key
              },
              handleImageResponse
            );
          },
          actionText: 'Take photo',
          icon: 'camera'
        },
        {
          action: async () => {
            eSendEvent(eCloseProgressDialog);
            await sleep(400);
            launchImageLibrary(
              {
                includeBase64: true,
                maxWidth: 2000,
                maxHeight: 2000,
                quality: 0.8,
                mediaType: 'photo',
                encryptToFile: false,
                ...key
              },
              handleImageResponse
            );
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
  imageResize25: `(function() {
    let node = tinymce.activeEditor.selection.getNode();
  if (tinymce.activeEditor.selection.getNode().tagName === 'IMG') {

    tinymce.activeEditor.undoManager.transact(function() {
      if (tinymce.activeEditor.dom.hasClass(node,"img_size_one")) {
        tinymce.activeEditor.dom.removeClass(node,"img_size_one")
      }
      if (tinymce.activeEditor.dom.hasClass(node,"img_size_two")) {
        tinymce.activeEditor.dom.removeClass(node,"img_size_two")
      }
      tinymce.activeEditor.dom.addClass(node,"img_size_three")
      setTimeout(function() {
        tinymce.activeEditor.nodeChanged({selectionChange:true})
      },100)
    });
 
  }

  })();
  
  `,
  imageResize50: `(function() {
    let node = tinymce.activeEditor.selection.getNode();
  if (tinymce.activeEditor.selection.getNode().tagName === 'IMG') {
      tinymce.activeEditor.undoManager.transact(function() {
      if (tinymce.activeEditor.dom.hasClass(node,"img_size_one")) {
        tinymce.activeEditor.dom.removeClass(node,"img_size_one")
      }
      if (tinymce.activeEditor.dom.hasClass(node,"img_size_three")) {
        tinymce.activeEditor.dom.removeClass(node,"img_size_three")
      }
      tinymce.activeEditor.dom.addClass(node,"img_size_two")
      setTimeout(function() {
        tinymce.activeEditor.nodeChanged({selectionChange:true})
      },100)
    
    });
   
  }
  })()
  
  `,
  imageResize100: `(function() {
    let node = tinymce.activeEditor.selection.getNode();
  if (tinymce.activeEditor.selection.getNode().tagName === 'IMG') {
    tinymce.activeEditor.undoManager.transact(function() {
      if (tinymce.activeEditor.dom.hasClass(node,"img_size_three")) {
        tinymce.activeEditor.dom.removeClass(node,"img_size_three")
      }
      if (tinymce.activeEditor.dom.hasClass(node,"img_size_two")) {
        tinymce.activeEditor.dom.removeClass(node,"img_size_two")
      }
      tinymce.activeEditor.dom.addClass(node,"img_size_one")
      setTimeout(function() {
        tinymce.activeEditor.nodeChanged({selectionChange:true})
      },100)
     
    });
  }
  })()
  
  `,
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
  imagefloatleft: `(function () {
let node = tinymce.activeEditor.selection.getNode();
  if (node.tagName === 'IMG') {
   
    tinymce.activeEditor.undoManager.transact(function() {
      if (tinymce.activeEditor.dom.hasClass(node,"img_float_right")) {
        tinymce.activeEditor.dom.removeClass(node,"img_float_right")
      }
      if (tinymce.activeEditor.dom.hasClass(node,"img_float_none")) {
        tinymce.activeEditor.dom.removeClass(node,"img_float_none")
      }
      tinymce.activeEditor.dom.addClass(node,"img_float_left")
      setTimeout(function() {
        tinymce.activeEditor.nodeChanged({selectionChange:true})
      },100)
    });
  }
  })();
  
  `,
  imagefloatright: `(function () {
let node = tinymce.activeEditor.selection.getNode();
  if (node.tagName === 'IMG') {
   
    tinymce.activeEditor.undoManager.transact(function() {
      if (tinymce.activeEditor.dom.hasClass(node,"img_float_left")) {
        tinymce.activeEditor.dom.removeClass(node, "img_float_left")
      }
      if (tinymce.activeEditor.dom.hasClass(node,"img_float_none")) {
        tinymce.activeEditor.dom.removeClass(node,"img_float_none")
      }
      tinymce.activeEditor.dom.addClass(node,"img_float_right")
      setTimeout(function() {
        tinymce.activeEditor.nodeChanged({selectionChange:true})
      },100)
     
    });
  }
  })()
  
  `,
  imagefloatnone: `(function () {
  let node = tinymce.activeEditor.selection.getNode();
  if (node.tagName === 'IMG') {
   
    tinymce.activeEditor.undoManager.transact(function() {
      if (tinymce.activeEditor.dom.hasClass(node,"img_float_left")) {
        tinymce.activeEditor.dom.removeClass(node,"img_float_left")
      }
      if (tinymce.activeEditor.dom.hasClass(node,"img_float_right")) {
        tinymce.activeEditor.dom.removeClass(node,"img_float_right")
      }
      tinymce.activeEditor.dom.addClass(node,"img_float_none")
      setTimeout(function() {
        tinymce.activeEditor.nodeChanged({selectionChange:true})
      },100)
    });
  }
  })()
  
  `,
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
  let b64 = `data:${image.type};base64, ` + image.base64;
  let hash = await Sodium.hashFile({
    uri: image.uri,
    type: 'url'
  });
  console.log('hash: ',hash);
  tiny.call(
    EditorWebView,
    `
    (function(){
      let image = ${JSON.stringify({
        hash: hash,
        type: image.type,
        filename: image.fileName,
        dataurl: b64
      })}
      tinymce.activeEditor.execCommand('mceAttachImage',image);
      setTimeout(function() {
        tinymce.activeEditor.nodeChanged({selectionChange:true})
      },100)
    })();
    `
  );
  attachFile(image.uri, hash, image.type, image.fileName);
};

async function attachFile(uri, hash, type, filename) {
  try {
    let exists = db.attachments.exists(hash);
    let encryptionInfo;
    if (!exists) {
      let key = await db.user.getEncryptionKey();
      encryptionInfo = await Sodium.encryptFile(key, {
        uri: uri,
        type: 'url',
        hash: hash
      });
      encryptionInfo.type = type;
      encryptionInfo.filename = filename;
      encryptionInfo.alg = `xcha-argon2i13`;
      encryptionInfo.size = encryptionInfo.length;
    } else {
      encryptionInfo = {hash: hash};
    }
    await db.attachments.add(encryptionInfo, getNote()?.id);
    return true;
  } catch (e) {
    console.log('attach file error: ', uri, hash, type, filename);
    return false;
  }
}
