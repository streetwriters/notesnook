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

function init_tiny(size) {
  tinymce.init({
    selector: '#tiny_textarea',
    menubar: false,
    min_height: size,
    skin_url: 'dist/skins/notesnook',
    content_css: 'dist/skins/notesnook',
    plugins: [
      'mychecklist advlist autolink textpattern hr lists link noneditable image charmap preview anchor',
      'searchreplace visualblocks fullscreen importcss',
      'mycode insertdatetime media imagetools table paste help wordcount autoresize directionality',
    ],
    toolbar: false,
    paste_data_images: true,
    images_upload_handler: function (blobInfo, success, failure) {
      success('data:' + blobInfo.blob().type + ';base64,' + blobInfo.base64());
    },
    statusbar: false,
    textpattern_patterns: markdownPatterns,
    contextmenu: false,
    content_style: `
    span.diff-del {
      background-color: #FDB0C0;  
    }
    span.diff-ins {
      background-color: #CAFFFB;  
    }
`,
    browser_spellcheck: true,
    autoresize_bottom_margin: 50,
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
        selectchange();
        reactNativeEventHandler('history', {
          undo: editor.undoManager.hasUndo(),
          redo: editor.undoManager.hasRedo(),
        });
      });

      editor.on('NewBlock', function (event) {

        if (event.newBlock.nodeName === "PRE") {
          console.log(event.newBlock);
          console.log(event.newBlock.prevSibling)
         }

      });

      editor.on('focus', () => {
        reactNativeEventHandler('focus', 'editor');
      });
      editor.on('SetContent', (event) => {
        if (!event.paste) {
          reactNativeEventHandler('noteLoaded', true);
        }
      });
      editor.on('ScrollIntoView', (e) => {
        e.preventDefault();
        e.elm.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
        });
      });
      editor.on('input', onChange);
      editor.on('keyup', onChange);
      editor.on('NodeChange', onChange);
    },
  });
}

const onChange = (event) => {

  if (isLoading) {
    isLoading = false;
    return;
  }
  if (editor.plugins.wordcount.getCount() === 0) return;
  selectchange();
  reactNativeEventHandler('tiny', editor.getContent());
  reactNativeEventHandler('history', {
    undo: editor.undoManager.hasUndo(),
    redo: editor.undoManager.hasRedo(),
  });
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
  editor.formatter
    .matchAll(formats)
    .forEach((format) => (currentFormats[format] = true));

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
      if (listElm.className === 'tox-checklist') {
        currentFormats.cl = true;
      } else {
        currentFormats.ul = style;
      }
    }
  }
  reactNativeEventHandler('selectionchange', currentFormats);
}
