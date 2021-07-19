attachTitleInputListeners();
autosize();
function reactNativeEventHandler(type, value) {
  if (window.ReactNativeWebView) {
    window.ReactNativeWebView.postMessage(
      JSON.stringify({
        type: type,
        value: value
      })
    );
  }
}

let changeTimer = null;

function init_tiny(size) {
  tinymce.init({
    selector: '#tiny_textarea',
    menubar: false,
    min_height: size,
    skin_url: 'dist/skins/notesnook',
    content_css: 'dist/skins/notesnook',
    plugins: [
      'mychecklist advlist autolink textpattern hr lists link noneditable image',
      'searchreplace mycode',
      'media imagetools table paste wordcount autoresize directionality'
    ],
    toolbar: false,
    paste_data_images: true,
    /*   images_upload_handler: function (blobInfo, success, failure) {
      success('data:' + blobInfo.blob().type + ';base64,' + blobInfo.base64());
    }, */
    statusbar: false,
    textpattern_patterns: markdownPatterns,
    contextmenu: false,
    content_style: `
    .img_float_left {
      float:left;
    }
    .img_float_right {
      float:right;
    }
    .img_float_none {
      float:none;
    }
    .img_size_one {
      width:100%;
    }
    .img_size_two {
      width:50%;
    }
    .img_size_three {
      width:25%;
    }
    span.diff-del {
      background-color: #FDB0C0;  
    }
    span.diff-ins {
      background-color: #CAFFFB;  
    }
    pre.codeblock {
      overflow-x:auto;
    }
    img {
      max-width:100% !important;
      height:auto !important;
    }
    .tox .tox-edit-area__iframe {
      background-color:transparent !important;
    }
    body {
      background-color:transparent !important;
    }
    iframe {
      max-width:100% !important;
      background-color:transparent !important;
    }
    table {
      display: block !important;
      overflow-x: auto !important;
      white-space: nowrap  !important;
      max-width:100% !important;
      width:100% !important;
      height:auto !important;
    }
    td {
      min-width:10vw !important;
    }
`,
    browser_spellcheck: true,
    autoresize_bottom_margin: 120,
    table_toolbar:
      'tablecellprops | tableinsertrowbefore tableinsertrowafter tabledeleterow | tableinsertcolbefore tableinsertcolafter tabledeletecol',
    imagetools_toolbar: 'rotateleft rotateright flipv fliph | imageopts ',
    placeholder: 'Start writing your note here',
    object_resizing: true,
    resize: true,
    mobile: {
      resize: false,
      object_resizing: false
    },
    image_description: false,
    image_caption: false,
    font_formats:
      'Times New Roman=times new roman,times;' +
      'Serif=serif;' +
      'Sans=sans-serif;' +
      'Classic=courier new;' +
      'Mono=monospace;',
    setup: function (editor) {
      editor.ui.registry.addButton('deleteimage', {
        icon: 'remove',
        tooltip: 'Remove image',
        onAction: function () {
          editor.undoManager.transact(function () {
            tinymce.activeEditor.execCommand('Delete');
          });
        },
        onclick: function () {
          editor.undoManager.transact(function () {
            tinymce.activeEditor.execCommand('Delete');
          });
        }
      });
      editor.ui.registry.addButton('imageopts', {
        icon: 'image-options',
        tooltip: 'Image properties',
        onAction: function () {
          reactNativeEventHandler('imageoptions');
        },
        onclick: function () {
          reactNativeEventHandler('imageoptions');
        }
      });

      editor.ui.registry.addButton('imagepreview', {
        icon: 'fullscreen',
        tooltip: 'Preview image',
        onAction: function () {
          if (tinymce.activeEditor.selection.getNode().tagName === 'IMG') {
            var xhr = new XMLHttpRequest();
            xhr.responseType = 'blob';

            xhr.onload = function () {
              var recoveredBlob = xhr.response;
              var reader = new FileReader();
              reader.onload = function () {
                var blobAsDataUrl = reader.result;
                reactNativeEventHandler('imagepreview', blobAsDataUrl);
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
        },
        onclick: function () {}
      });
    },
    init_instance_callback: function (edit) {
      editor = edit;
      setTheme();
      reactNativeEventHandler('status', true);

      editor.on('SelectionChange', function (e) {
        selectchange();
        reactNativeEventHandler('history', {
          undo: editor.undoManager.hasUndo(),
          redo: editor.undoManager.hasRedo()
        });
      });

      editor.on('focus', function () {
        reactNativeEventHandler('focus', 'editor');
      });

      editor.on('SetContent', function (event) {
        if (!event.paste) {
          reactNativeEventHandler('noteLoaded', true);
        }
        if (event.paste) {
          isLoading = false;
          onChange(event);
        }
      });

      editor.on('ScrollIntoView', function (e) {
        e.preventDefault();
        e.elm.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest'
        });
      });
      editor.on('input', onChange);
      editor.on('keyup', onChange);
      editor.on('NodeChange', onChange);
    }
  });
}
window.prevContent = '';
const onChange = function (event) {
  if (event.type === 'nodechange' && !event.selectionChange) return;
  if (isLoading) {
    isLoading = false;
    return;
  }
  if (editor.plugins.wordcount.getCount() === 0) return;
  clearTimeout(changeTimer);
  changeTimer = null;
  changeTimer = setTimeout(function () {
    selectchange();
    reactNativeEventHandler('tiny', editor.getContent());
    reactNativeEventHandler('history', {
      undo: editor.undoManager.hasUndo(),
      redo: editor.undoManager.hasRedo()
    });
  }, 1);
};

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

function selectchange() {
  info = document.querySelector('.info-bar');
  info.querySelector('#infowords').innerText =
    editor.plugins.wordcount.getCount() + ' words';

  let formats = Object.keys(editor.formatter.get());
  let currentFormats = {};
  editor.formatter.matchAll(formats).forEach(function (format) {
    currentFormats[format] = true;
  });

  let node = editor.selection.getNode();
  currentFormats.hilitecolor = getNodeBg(node);
  currentFormats.forecolor = getNodeColor(node);

  if (!currentFormats.hilitecolor || !currentFormats.forecolor) {
    for (var i = 0; i < node.children.length; i++) {
      let item = editor.selection.getNode().children.item(i);
      currentFormats.hilitecolor = getNodeBg(item);
      currentFormats.forecolor = getNodeColor(item);
    }
  }
  let range = editor.selection.getRng();

  currentFormats.current = {
    index: range.startOffset,
    length: range.endOffset - range.startOffset
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

  currentFormats.fontname = editor.selection.getNode().style.fontFamily;

  if (/^(LI|UL|OL|DL)$/.test(node.nodeName)) {
    let listElm = editor.selection.getNode();
    if (listElm.nodeName === 'LI') {
      listElm = editor.dom.getParent(listElm, 'ol,ul');
    }

    let style = editor.dom.getStyle(listElm, 'listStyleType');
    if (style === '') {
      style = 'default';
    }
    if (listElm.nodeName === 'OL') {
      currentFormats.ol = style;
    } else {
      if (!listElm) return;
      if (listElm.className === 'tox-checklist') {
        currentFormats.cl = true;
      } else {
        currentFormats.ul = style;
      }
    }
  }
  currentFormats.node = editor.selection.getNode().nodeName;
  reactNativeEventHandler('selectionchange', currentFormats);
}
