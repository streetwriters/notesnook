import { Platform } from 'react-native';
import { useEditorStore } from '../../../../stores/stores';
import { EditorWebView, textInput } from '../../Functions';
import tiny from '../tiny';

export const endSearch = () => {
  tiny.call(EditorWebView, `tinymce.activeEditor.plugins.searchreplace.done()`);
  textInput.current?.focus();
  useEditorStore.getState().setSearchReplace(false);
  Platform.OS === 'android' && EditorWebView.current?.requestFocus();
  tiny.call(EditorWebView, tiny.focusEditor);
};

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
  forecolor: color => `tinymce.activeEditor.execCommand('ForeColor',false, '${color}');`,
  hilitecolor: color => `tinymce.activeEditor.execCommand('HiliteColor',false, '${color}');`,
  dforecolor: color => `tinymce.activeEditor.execCommand('ForeColor',false, '${color}');`,
  dhilitecolor: color => `tinymce.activeEditor.execCommand('HiliteColor',false, '${color}');`,
  fontname: fontname => `tinymce.activeEditor.execCommand('FontName',false, '${fontname}');`,
  indent: `tinymce.activeEditor.execCommand('Indent');`,
  outdent: `tinymce.activeEditor.execCommand('Outdent');`,
  blockquote: `tinymce.activeEditor.execCommand('mceBlockQuote');`,
  link: link => `tinymce.activeEditor.execCommand('mceInsertLink',false, '${link}');`,
  unlink: `tinymce.activeEditor.execCommand('Unlink')`,
  fontsize: size => `tinymce.activeEditor.execCommand('FontSize', false, '${size}');`,
  removeformat: `tinymce.activeEditor.execCommand('RemoveFormat');`,
  p: `tinymce.activeEditor.execCommand('FormatBlock', false, 'p');`,
  h1: `tinymce.activeEditor.execCommand('FormatBlock', false, 'h2');`,
  h2: `tinymce.activeEditor.execCommand('FormatBlock', false, 'h2');`,
  h3: `tinymce.activeEditor.execCommand('FormatBlock', false, 'h3');`,
  h4: `tinymce.activeEditor.execCommand('FormatBlock', false, 'h4');`,
  h5: `tinymce.activeEditor.execCommand('FormatBlock', false, 'h5');`,
  h6: `tinymce.activeEditor.execCommand('FormatBlock', false, 'h6');`,
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
        tinymce.activeEditor.fire("input",{data:""})
        tinymce.activeEditor.selection.setRng(rng)
     }  
     editor.undoManager.transact(function() {
      tinymce.activeEditor.execCommand('mceInsertTable', false, { rows: ${r}, columns: ${c} }); 
     }); 
     
    })();`,

  cl: `tinymce.activeEditor.execCommand('insertCheckList')`,
  video: `tinymce.activeEditor.execCommand('mceMedia')`,
  pre: `
    tinymce.activeEditor.execCommand('mceInsertCodeBlock')
  `,
  tablecellprops: `tableCellNodeOptions()`,
  tableprops: "tinymce.activeEditor.execCommand('mceTableProps');",
  tabledelete: "tinymce.activeEditor.execCommand('mceTableDelete');",
  tablesplitcell: "tinymce.activeEditor.execCommand('mceTableSplitCells');",
  tablemergecell: "tinymce.activeEditor.execCommand('mceTableMergeCells');",
  tablerowprops: `tableRowNodeOptions()`,
  tableinsertrowbefore: `tinymce.activeEditor.execCommand('mceTableInsertRowBefore');`,
  tableinsertcolbefore: `tinymce.activeEditor.execCommand('mceTableInsertColBefore');`,
  imageResize25: () => setImageSize(0.25),
  imageResize50: () => setImageSize(0.5),
  imageResize100: () => setImageSize(1),
  imagepreview: `(function() {
    let node = tinymce.activeEditor.selection.getNode()
    if (node.tagName === 'IMG') {
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
        node.getAttribute('src')
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
      tinymce.activeEditor.fire("input",{data:""})
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

const setFloat = float => `(function () {
  let node = tinymce.activeEditor.selection.getNode();
  if (node.tagName === 'IMG') {
    tinymce.activeEditor.undoManager.transact(function() {
      node.style.float = "${float}";
      setTimeout(function() {
        tinymce.activeEditor.fire("input",{data:""})
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
      tinymce.activeEditor.fire("input",{data:""})
    },100)
  });
}
})();
`;
