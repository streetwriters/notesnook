attachTitleInputListeners();
autosize();
function reactNativeEventHandler(type, value) {
  if (window.ReactNativeWebView) {
    window.ReactNativeWebView.postMessage(
      JSON.stringify({
        type: type,
        value: value,
      }),
    );
  }
}

let changeTimer = null;
let isLoading = true;
let editor = null;
function init_tiny(size) {
  tinymce.init({
    selector: '#tiny_textarea',
    menubar: false,
    min_height: size,
    skin_url: 'dist/skins/notesnook',
    content_css: 'dist/skins/notesnook',
    plugins: [
      'mychecklist advlist autolink lists link image charmap preview anchor',
      'searchreplace visualblocks code fullscreen',
      'insertdatetime media imagetools table paste help wordcount autoresize directionality',
    ],
    toolbar: false,
    paste_data_images: true,
    images_upload_handler: function (blobInfo, success, failure) {
      success('data:' + blobInfo.blob().type + ';base64,' + blobInfo.base64());
    },
    statusbar: false,
    contextmenu: false,
    imagetools_toolbar: 'rotateleft rotateright | flipv fliph',
    placeholder: 'Start writing your note here',
    object_resizing: true,
    font_formats:
      'Times New Roman=times new roman,times;' +
      'Serif=serif;' +
      'Sans=sans-serif;' +
      'Classic=courier new;' +
      'Mono=monospace;',
    init_instance_callback: function (edit) {
      editor = edit;
      setTheme();
      reactNativeEventHandler('status', true);
      editor.on('SelectionChange', function (e) {
        clearTimeout(changeTimer);
        if (isLoading) {
          isLoading = false;
          return;
        }
        changeTimer = setTimeout(() => {
          if (tinymce.activeEditor.plugins.wordcount.getCount() === 0) return;
          selectchange();
          reactNativeEventHandler('tiny', editor.getContent());
          reactNativeEventHandler('history', {
            undo: tinymce.activeEditor.undoManager.hasUndo(),
            redo: tinymce.activeEditor.undoManager.hasRedo(),
          });
        }, 5);
      });
      editor.on('focus', () => {
        reactNativeEventHandler('focus', 'editor');
      });
      editor.on('SetContent', (event) => {
        if (!event.paste) {
          reactNativeEventHandler('noteLoaded', true);
        }
      });
      editor.on('Change', function (e) {
        clearTimeout(changeTimer);
        if (isLoading) {
          isLoading = false;
          return;
        }

        changeTimer = setTimeout(() => {
          if (tinymce.activeEditor.plugins.wordcount.getCount() === 0) return;
          selectchange();
          reactNativeEventHandler('tiny', tinymce.activeEditor.getContent());
          reactNativeEventHandler('history', {
            undo: tinymce.activeEditor.undoManager.hasUndo(),
            redo: tinymce.activeEditor.undoManager.hasRedo(),
          });
        }, 5);
      });
    },
  });
}

function getNodeColor(element) {
  if (element.style.color && element.style.color !== '') {
    return element.style.color;
  }
  return null;
}

function getNodeBg(element) {
  if (element.style.backgroundColor && element.style.backgroundColor !== '') {
    return element.style.backgroundColor;
  }
  return null;
}

function selectchange(editor) {
  info = document.querySelector('.info-bar');
  info.querySelector('#infowords').innerText =
    tinymce.activeEditor.plugins.wordcount.getCount() + ' words';

  let formats = Object.keys(tinymce.activeEditor.formatter.get());
  let currentFormats = {};
  tinymce.activeEditor.formatter
    .matchAll(formats)
    .forEach((format) => (currentFormats[format] = true));

  let node = tinymce.activeEditor.selection.getNode();
  currentFormats.hilitecolor = getNodeBg(node);
  currentFormats.forecolor = getNodeColor(node);

  if (!currentFormats.hilitecolor || !currentFormats.forecolor) {
    for (var i = 0; i < node.children.length; i++) {
      let item = tinymce.activeEditor.selection.getNode().children.item(i);
      currentFormats.hilitecolor = getNodeBg(item);
      currentFormats.forecolor = getNodeColor(item);
    }
  }
  let range = editor.selection.getRng();

  currentFormats.current = {
    index: range.startOffset,
    length: range.endOffset - range.startOffset,
  };
  currentFormats.fontsize = editor.selection.getNode().style.fontSize;

  if (currentFormats.fontsize === '') {
    currentFormats.fontsize = '12pt';

    if (currentFormats.h2) {
      currentFormats.fontsize = '18pt';
    }
    if (currentFormats.h3) {
      currentFormats.fontsize = '14pt';
    }
    if (currentFormats.h4) {
      currentFormats.fontsize = '12pt';
    }
    if (currentFormats.h5) {
      currentFormats.fontsize = '10pt';
    }
    if (currentFormats.h6) {
      currentFormats.fontsize = '8pt';
    }
  }
  if (node.nodeName === 'A') {
    currentFormats.link = node.getAttribute('href');
  }

  currentFormats.fontname = tinymce.activeEditor.selection.getNode().style.fontFamily;

  if (/^(LI|UL|OL|DL)$/.test(node.nodeName)) {
    let listElm = tinymce.activeEditor.selection.getNode();
    if (listElm.nodeName === 'LI') {
      listElm = tinymce.activeEditor.dom.getParent(listElm, 'ol,ul');
    }

    let style = tinymce.activeEditor.dom.getStyle(listElm, 'listStyleType');
    if (style === '') {
      style = 'default';
    }
    if (listElm.nodeName === 'OL') {
      currentFormats.ol = style;
    } else {
      if (listElm.className === 'tox-checklist') {
        currentFormats.cl = true;
      } else {
        currentFormats.ul = style;
      }
    }
  }
  reactNativeEventHandler('selectionchange', currentFormats);
}
