let titleInput = document.getElementById('titleInput');
let infoBar = '.info-bar';
let info = null;

function attachTitleInputListeners() {
  infoBar = '.info-bar';
  document.addEventListener(
    'DOMContentLoaded',
    () => {
      autosize();
    },
    false,
  );

  document.getElementById('formBox').onsubmit = function (evt) {
    evt.preventDefault();
    editor.focus();
    editor.setSelection(editor.getText().length - 1, 0);
    onTitleChange();
  };

  titleInput.onkeypress = function (evt) {
    if (evt.keyCode === 13 || evt.which === 13) {
      evt.preventDefault();
      editor.focus();
      onTitleChange();
      return false;
    }
  };

  titleInput.addEventListener('focus', function (evt) {
    if (window.ReactNativeWebView) {
      window.ReactNativeWebView.postMessage(
        JSON.stringify({
          type: 'focus',
          value: 'title',
        }),
      );
    }
  });

  titleInput.onkeydown = function (evt) {
    onTitleChange(evt);
  };

  titleInput.onchange = function (evt) {
    autosize();
  };
  titleInput.onkeyup = function (evt) {
    onTitleChange(evt);
  };
}

function onTitleChange(ele) {
 if (isLoading) return;
  let titleMessage = {
    type: 'title',
    value: titleInput.value,
  };
  info = document.querySelector(infoBar);
  info.querySelector('#infowords').innerText =
    editor.plugins.wordcount.getCount() + ' words';

  autosize();
  if (titleMessage && typeof titleMessage.value === 'string') {
    if (window.ReactNativeWebView) {
      window.ReactNativeWebView?.postMessage(JSON.stringify(titleMessage));
    }
  }
}

function autosize() {
  let ele = document.getElementById('textCopy');
  ele.innerHTML = titleInput.value.replace(/\n/g, '<br/>');
  let newHeight = document.getElementById('titlebar').scrollHeight;
  let css = document.createElement('style');
  css.type = 'text/css';
  let node = `
      .tox-tinymce {
        min-height:calc(100vh - ${newHeight}px) !important;
        };
   `;
  css.appendChild(document.createTextNode(node));
  document.getElementsByTagName('head')[0].appendChild(css);
}
