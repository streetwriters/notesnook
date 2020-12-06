let titleInput = isTablet ? 'titleInput' : 'simpleTitleInput';
let infoBar = isTablet ? '.info-bar' : '.info-bar-alt';
let info = null;
function attachTitleInputListeners() {
  titleInput = isTablet ? 'titleInput' : 'simpleTitleInput';
  infoBar = isTablet ? '.info-bar' : '.info-bar-alt';
  document.addEventListener(
    'DOMContentLoaded',
    () => {
      autosize();
      document
        .querySelector('.app-main')
        .addEventListener('scroll', (event) => {
          if (scrollTimer) {
            clearTimeout(scrollTimer);
            scrollTimer = null;
          }
          scrollTimer = setTimeout(() => {
            window.ReactNativeWebView.postMessage(
              JSON.stringify({
                visible: document.querySelector('.app-main').scrollTop,
                title: document.getElementById(titleInput).value,
                type: 'scroll',
              }),
            );
          }, 100);
        });
    },
    false,
  );

  document.getElementById('formBox').onsubmit = function (evt) {
    evt.preventDefault();
    editor.focus();
    editor.setSelection(editor.getText().length - 1, 0);
    onTitleChange();
  };

  document.getElementById(titleInput).onkeypress = function (evt) {
    if (evt.keyCode === 13 || evt.which === 13) {
      evt.preventDefault();
      editor.focus();
      editor.setSelection(editor.getText().length - 1, 0);
      onTitleChange();
      return false;
    }
  };

  document.getElementById(titleInput).onkeydown = function (evt) {
    onTitleChange(evt);
  };

  document.getElementById(titleInput).onchange = function (evt) {
    autosize();
  };

  document.getElementById(titleInput).onkeyup = function (evt) {
    onTitleChange(evt);
  };
}

function onTitleChange(ele) {
  let titleMessage = {
    type: 'title',
    value: document.getElementById(titleInput).value,
  };
  autosize();
  if (titleMessage && typeof titleMessage.value === 'string') {
    window.ReactNativeWebView.postMessage(JSON.stringify(titleMessage));
  }
}

function autosize() {
  if (isTablet) {
    document.getElementById('textCopy').innerHTML = document
      .getElementById(titleInput)
      .value.replace(/\n/g, '<br/>');
  }
}

function attachEditorListeners() {
  /*  editor.once('text-change', function () {
    window.ReactNativeWebView.postMessage('loaded');
  }); */
  titleInput = isTablet ? 'titleInput' : 'simpleTitleInput';
  infoBar = isTablet ? '.info-bar' : '.info-bar-alt';

  document.addEventListener('message', (data) => {
    let message = JSON.parse(data.data);
    let type = message.type;
    let value;
    if (message.value && message.type !== 'nomenu') {
      value = message.value;
    } else {
      value = message.value;
    }
    switch (type) {
      case 'reset': {
        editor.history.clear();
        editor.setText('', 'api');
        document.getElementById(titleInput).value = '';
        document.getElementById(titleInput).blur();
        editor.blur();
        document.getElementById(titleInput).blur();
        window.blur();

        info = document.querySelector(infoBar);
        info.querySelector('#infodate').innerText = '';
        info.querySelector('#infosaved').innerText = '';
        info.querySelector('#infowords').innerText = '';
        autosize();
        break;
      }
      case 'keyboard':
        var range = editor.getSelection();
        if (range) {
          if (range.length == 0) {
            var bounds = editor.getBounds(range.index, range.index);

            setTimeout(() => {
              document
                .querySelector('.app-main')
                .scrollTo({top: bounds.top, behavior: 'smooth'});
            }, 200);
          }
        }
        break;
      case 'blur':
        document.getElementById(titleInput).blur();
        editor.blur();
        window.blur();
        break;
      case 'undo':
        editor.history.undo();
        break;
      case 'redo':
        editor.history.redo();
        break;
      case 'clearHistory':
        editor.history.clear();
        break;
      case 'dateEdited':
        linfo = document.querySelector(infoBar);
        info.querySelector('#infodate').innerText = value;
        break;
      case 'saving':
        info = document.querySelector(infoBar);
        info.querySelector('#infosaved').innerText = value;
        break;
      case 'text':
        editor.setText(value, 'api');

        setTimeout(() => {
          info = document.querySelector(infoBar);
          info.querySelector('#infowords').innerText =
            editor.getText().split(' ').length + ' words';
            info.querySelector('#infosaved').innerText = 'Saved';
        }, 100);

        break;
      case 'clearEditor':
        editor.setText('', 'api');
        break;
      case 'clearTitle':
        document.getElementById(titleInput).value = '';
        break;
      case 'focusEditor':
        editor.focus();
        break;
      case 'focusTitle':
        document.getElementById(titleInput).focus();
        autosize();
        break;
      case 'nomenu':
        let isenabled = value;
        //let width = window.innerWidth;
        let titleIn = document.getElementById('titlebar');
        if (isenabled) {
          //titleIn.style.width = width;
          titleIn.style['padding-left'] = 12;
          titleIn.style['padding-right'] = window.innerWidth * 0.4;
        } else {
          //titleIn.style.width = width - 120;
          titleIn.style['padding-left'] = 60;
          titleIn.style['padding-right'] = window.innerWidth * 0.4;
        }
        break;
      case 'title':
        document.getElementById(titleInput).value = JSON.parse(data.data).value;
        autosize();
        break;
      case 'theme':
        pageTheme.colors = value;
        setTheme();
        break;

      case 'delta':
        const content = value;
        editor.setContents(content, 'api');

        setTimeout(() => {
          info = document.querySelector(infoBar);
          info.querySelector('#infowords').innerText =
            editor.getText().split(' ').length + ' words';
            info.querySelector('#infosaved').innerText = 'Saved';

          document.body.scrollTop = 0; // For Safari
          document.documentElement.scrollTop = 0; // For Chrome, Firefox, IE and Opera
        }, 100);
        autosize();
        break;
      case 'html':
        editor.setContents(editor.clipboard.convert(value, 'api'), 'silent');
        /*  setTimeout(() => {
                   editor.setSelection(editor.getText().length - 1, 0);
                 }, 0); */
        break;
      default:
        break;
    }
  });

  function isWhitespace(ch) {
    let whiteSpace = false;
    if (ch === ' ' || ch === '\t' || ch === '\n') {
      whiteSpace = true;
    }
    return whiteSpace;
  }

  let deltaTimeout = null;
  let historyTimeout = null;

  editor.on('text-change', function (delta, oldDelta, source) {
    var regex = /https?:\/\/[^\s]+$/;
    if (source === 'api') return;
    if (
      delta.ops.length === 2 &&
      delta.ops[0].retain &&
      isWhitespace(delta.ops[1].insert)
    ) {
      var endRetain = delta.ops[0].retain;
      var text = editor.getText().substr(0, endRetain);
      var match = text.toLowerCase().match(regex);

      if (match !== null) {
        var url = match[0];

        var ops = [];
        if (endRetain > url.length) {
          ops.push({retain: endRetain - url.length});
        }

        ops = ops.concat([
          {delete: url.length},
          {insert: url, attributes: {link: url}},
        ]);

        editor.updateContents({
          ops: ops,
        });
      }
    }
    info = document.querySelector(infoBar);
    let infowords = info.querySelector('#infowords');
    if (infowords) {
      infowords.innerText =
        editor.getText().split(' ').length + ' words';
    }

    if (deltaTimeout) {
      clearTimeout(deltaTimeout);
      deltaTimeout = null;
    }

    deltaTimeout = setTimeout(() => {
      let msg = JSON.stringify({
        data: editor.getContents().ops,
        type: 'delta',
      });
      window.ReactNativeWebView.postMessage(msg);
    }, 50);

    if (historyTimeout) {
      clearTimeout(historyTimeout);
      historyTimeout = null;
    }

    historyTimeout = setTimeout(() => {
      let history = JSON.stringify({
        type: 'history',
        undo: editor.history.stack.undo.length,
        redo: editor.history.stack.redo.length,
      });
      window.ReactNativeWebView.postMessage(history);
    }, 1000);
  });
}
