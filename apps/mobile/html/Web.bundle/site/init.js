attachTitleInputListeners();
autosize();
function reactNativeEventHandler(type, value) {
  if (window.ReactNativeWebView) {
    console.log('type', type, 'id:', sessionId);
    window.ReactNativeWebView.postMessage(
      JSON.stringify({
        type: type,
        value: value,
        sessionId: sessionId
      })
    );
  }
}

let DEFAULT_FONT_SIZE = '12pt';
let EDITOR_SETTINGS = {
  fontSize: 12,
  directionality: 'ltr'
};

function loadSettings() {
  let settings = localStorage.getItem('editorSettings');
  if (settings) {
    settings = JSON.parse(settings);
    EDITOR_SETTINGS = settings;
  }
}

function changeDirection(rtl) {
  loadSettings();
  EDITOR_SETTINGS.directionality = rtl ? 'rtl' : 'ltr';
  localStorage.setItem('editorSettings', JSON.stringify(EDITOR_SETTINGS));
  if (rtl) {
    tinymce.activeEditor.execCommand('mceDirectionRTL');
  } else {
    tinymce.activeEditor.execCommand('mceDirectionLTR');
  }
  reactNativeEventHandler('editorSettings', EDITOR_SETTINGS);
}

function changeFontSize(size) {
  loadSettings();
  DEFAULT_FONT_SIZE = `${size}pt`;
  EDITOR_SETTINGS.fontSize = size;
  localStorage.setItem('editorSettings', JSON.stringify(EDITOR_SETTINGS));
  addStyle();
  reactNativeEventHandler('editorSettings', EDITOR_SETTINGS);
}

function loadFontSize() {
  loadSettings();
  DEFAULT_FONT_SIZE = EDITOR_SETTINGS.fontSize + 'pt';
  reactNativeEventHandler('editorSettings', EDITOR_SETTINGS);
}

let changeTimer = null;
const COLLAPSED_KEY = 'c';
const HIDDEN_KEY = 'h';
const collapsibleTags = {HR: 1, H2: 2, H3: 3, H4: 4, H5: 5, H6: 6};
let styleElement;

function addStyle() {
  if (!tinymce.activeEditor) return;
  if (!styleElement) {
    let doc = tinymce.activeEditor.dom.doc;
    styleElement = doc.head.appendChild(document.createElement('style'));
  }
  styleElement.innerHTML = `
  body {
    font-size:${DEFAULT_FONT_SIZE} !important;
  }
  .mce-content-body .c::before{
    background-color:${pageTheme.colors.accent};
    border-radius:3px;
    color:white;
  }
  `;
}

function toggleElementVisibility(element, toggleState) {
  if (!toggleState) element.classList.remove(HIDDEN_KEY);
  else element.classList.add(HIDDEN_KEY);
}

function collapseElement(target) {
  let sibling = target.nextSibling;
  const isTargetCollapsed = target.classList.contains(COLLAPSED_KEY);
  let skip = false;

  while (
    sibling &&
    (!collapsibleTags[sibling.tagName] ||
      collapsibleTags[sibling.tagName] > collapsibleTags[target.tagName])
  ) {
    const isCollapsed = sibling.classList.contains(COLLAPSED_KEY);
    if (!isTargetCollapsed) {
      if (isCollapsed) {
        skip = true;
        toggleElementVisibility(sibling, isTargetCollapsed);
      } else if (skip && collapsibleTags[sibling.tagName]) {
        skip = false;
      }
    }
    if (!skip) {
      toggleElementVisibility(sibling, isTargetCollapsed);
    }
    addStyle();
    if (!sibling.nextSibling) break;
    sibling = sibling.nextSibling;
  }
}
let undoTimer = null;
function onUndoChange() {
  clearTimeout(undoTimer);
  undoTimer = setTimeout(function () {
    reactNativeEventHandler('history', {
      undo: tinymce.activeEditor.undoManager.hasUndo(),
      redo: tinymce.activeEditor.undoManager.hasRedo()
    });
  }, 1000);
}

function init_callback(_editor) {
  editor = _editor;
  console.log('init_call',editor);
  setTheme();

  editor.on('SelectionChange', function (e) {
    selectchange();
  });

  editor.on('ClearUndos', onUndoChange);
  editor.on('Undo', onUndoChange);
  editor.on('Redo', onUndoChange);
  editor.on('TypingUndos', onUndoChange);
  editor.on('BeforeAddUndo', onUndoChange);
  editor.on('AddUndo', onUndoChange);
  editor.on('cut', function () {
    onChange({type: 'cut'});
    onUndoChange();
  });
  editor.on('copy', onUndoChange);
  editor.on('paste', function () {
    onChange({type: 'paste'});
  });

  editor.on('focus', function () {
    reactNativeEventHandler('focus', 'editor');
  });

  editor.on('SetContent', function (event) {
    if (globalThis.isClearingNoteData) {
      globalThis.isClearingNoteData = false;
      return;
    }
    setTimeout(function () {
      editor.undoManager.transact(function () {});
    }, 1000);
    if (!event.paste) {
      reactNativeEventHandler('noteLoaded', true);
    }
  });

  editor.on('NewBlock', function (e) {
    console.log('New Block');
    const {newBlock} = e;
    let target;
    if (newBlock) {
      target = newBlock.previousElementSibling;
    }
    if (target && target.classList.contains(COLLAPSED_KEY)) {
      target.classList.remove(COLLAPSED_KEY);
      collapseElement(target);
    }
  });

  editor.on('touchstart mousedown', function (e) {
    const {target} = e;
    if (
      e.offsetX < 6 &&
      collapsibleTags[target.tagName] &&
      target.parentElement &&
      target.parentElement.tagName === 'BODY'
    ) {
      e.preventDefault();
      e.stopImmediatePropagation();
      e.stopPropagation();
      editor.undoManager.transact(function () {
        if (target.classList.contains(COLLAPSED_KEY)) {
          target.classList.remove(COLLAPSED_KEY);
        } else {
          target.classList.add(COLLAPSED_KEY);
        }
        collapseElement(target);
        editor.getHTML().then(function (html) {
          reactNativeEventHandler('tiny', html);
        });
      });
    }
  });

  editor.on('tap', function (e) {
    if (
      e.target.classList.contains('mce-content-body') &&
      !e.target.innerText.length > 0
    ) {
      e.preventDefault();
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
  editor.on('compositionend', onChange);
}

const plugins = [
  'checklist advlist autolink textpattern hr lists link noneditable image',
  'searchreplace codeblock inlinecode keyboardquirks attachmentshandler',
  'media imagetools table paste wordcount autoresize directionality blockescape contenthandler'
];

const content_style = `
body: {
  font-family:"Open Sans";
}
.mce-content-body h2::before,
h3::before,
h4::before,
h5::before,
h6::before {
  font-size: 11px;
  font-weight: normal;
  letter-spacing: 1.1px;
  padding: 1px 3px 1px 3px;
  margin-left: -12px;
  margin-right: 5px;
  cursor: row-resize;
  margin-top:-3px;
  vertical-align:middle;
  }
  
  .mce-content-body h2::before {
  content: "H2";
  }
  
  .mce-content-body h3::before {
  content: "H3";
  }
  
  .mce-content-body h4::before {
  content: "H4";
  }
  
  .mce-content-body h5::before {
  content: "H5";
  }

  .h {
    display: none;
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
  border-radius:5px !important;
}
.tox .tox-edit-area__iframe {
  background-color:transparent !important;
}

.tox .tox-tbtn--select {
  min-width: 120px;
}

body {
  background-color:transparent !important;
  font-size:${DEFAULT_FONT_SIZE}
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
h1,
h2,
h3,
h4,
h5,
h6,
strong {
  font-weight:600 !important;
}
`;

function init_tiny(size) {
  loadFontSize();
  console.log('init tinymce');
  tinymce.init({
    selector: '#tiny_textarea',
    menubar: false,
    min_height: size,
    directionality: EDITOR_SETTINGS.directionality,
    skin_url: 'dist/skins/notesnook',
    content_css: 'dist/skins/notesnook',
    attachmenthandler_download_attachment: hash => {
      reactNativeEventHandler('attachment_download', hash);
    },
    custom_undo_redo_levels : 10,
    plugins: plugins,
    toolbar: false,
    keep_styles: false,
    paste_data_images: true,
    statusbar: false,
    textpattern_patterns: markdownPatterns,
    contextmenu: false,
    extended_valid_elements: `img[*|src=placeholder.svg]`,
    invalid_styles: {
      span: `--progress`
    },
    content_style: content_style,
    browser_spellcheck: true,
    autoresize_bottom_margin: 120,
    table_toolbar:
      'tablecellprops | tableinsertrowbefore tableinsertrowafter tabledeleterow | tableinsertcolbefore tableinsertcolafter tabledeletecol',
    imagetools_toolbar:
      'imagedownload | rotateleft rotateright flipv fliph | imageopts ',
    placeholder: 'Start writing your note here',
    object_resizing: true,
    resize: true,
    mobile: {
      resize: false,
      object_resizing: false
    },
    image_description: false,
    image_caption: false,
    media_dimensions: false,
    font_formats:
      'Times New Roman=times new roman,times;' +
      'Serif=serif;' +
      'Open Sans=open sans;' +
      'Classic=courier new;' +
      'Mono=monospace;',
    paste_postprocess: function (_, args) {
      try {
        window.processPastedContent(args.node);
      } catch (e) {
        console.error(e);
      }
    },
    init_instance_callback: init_callback,
    setup: setup_tiny
  });
}

function setup_tiny(_editor) {
  editor = _editor;
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

  editor.on('init', function (e) {
    reactNativeEventHandler('status', true);
  });

  editor.ui.registry.addButton('deletevideo', {
    icon: 'remove',
    tooltip: 'Remove iframe',
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

  editor.ui.registry.addContextToolbar('iframecontrols', {
    predicate: function (node) {
      return node.getAttribute('data-mce-object') === 'iframe';
    },
    items: 'deletevideo',
    position: 'node',
    scope: 'node'
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

  editor.ui.registry.addButton('imagedownload', {
    icon: 'save',
    tooltip: 'Download image',
    onAction: function () {
      let node = tinymce.activeEditor.selection.getNode();
      if (node.tagName === 'IMG' && node.dataset && node.dataset.hash) {
        window.ReactNativeWebView.postMessage(
          JSON.stringify({
            type: 'attachment_download',
            value: node.dataset.hash,
            sessionId: sessionId
          })
        );
      }
    },
    onclick: function () {}
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
}

let prevCount = 0;

function delay(base = 0) {
  if (prevCount < 20000) return base + 200;
  if (prevCount > 20000 && prevCount < 40000) return base + 400;
  if (prevCount > 40000 && prevCount < 70000) return base + 600;
  if (prevCount > 70000) return base + 1000;
}

const onChange = function (event) {
  console.log(event.type, event.selectionChange);
  if (event.type === 'nodechange' && !event.selectionChange) return;

  if (isLoading) {
    isLoading = false;
    return;
  }

  if (prevCount === 0) {
    updateCount(0);
  }

  if (prevCount === 0) return;
  console.log('editor changed', event.selectionChange);
  reactNativeEventHandler('noteedited');
  clearTimeout(changeTimer);
  changeTimer = null;
  changeTimer = setTimeout(function () {
    editor.getHTML().then(function (html) {
      reactNativeEventHandler('tiny', html);
    });
    onUndoChange();
    selectchange();
  }, delay());
};

let countTimer;
function updateCount(timer = 1000) {
  countTimer = null;

  if (!timer) {
    let count = editor.countWords();
    info = document.querySelector('.info-bar');
    info.querySelector('#infowords').innerText = count + ' words';
    prevCount = count;
  } else {
    countTimer = setTimeout(function () {
      let count = editor.countWords();
      info = document.querySelector('.info-bar');
      info.querySelector('#infowords').innerText = count + ' words';
      prevCount = count;
    }, delay(timer));
  }
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

let selectionTimer = null;
function selectchange() {
  clearTimeout(selectionTimer);
  selectionTimer = null;
  selectionTimer = setTimeout(function () {
    console.log('selection change called');
    updateCount();
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
      currentFormats.fontsize = DEFAULT_FONT_SIZE;

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
  }, 300);
}
