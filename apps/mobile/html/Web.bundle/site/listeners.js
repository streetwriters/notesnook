let titleInput = document.getElementById('titleInput');
let infoBar = '.info-bar';
let info = null;
let scrollTimer = null;

function onDomContentLoaded() {
  document.body.onscroll = function (event) {
    if (scrollTimer) {
      clearTimeout(scrollTimer);
      scrollTimer = null;
    }
    updateInfoBar();
    scrollTimer = setTimeout(function () {

      window.ReactNativeWebView.postMessage(
        JSON.stringify({
          visible: event.target.documentElement.scrollTop,
          title: document.getElementById('titleInput').value,
          type: 'scroll',
          sessionId:sessionId
        })
      
      );
    }, 100);
  };
}

function attachTitleInputListeners() {
  infoBar = '.info-bar';
  document.addEventListener('DOMContentLoaded', onDomContentLoaded, false);

  document.getElementById('titleInput').onkeypress = function (evt) {
    if (evt.keyCode === 13 || evt.which === 13) {
      evt.preventDefault();
      if (tinymce.activeEditor) {
        tinymce.activeEditor && tinymce.activeEditor.focus();
      }
      onTitleChange();
      return false;
    }
  };

  document
    .getElementById('titleInput')
    .addEventListener('focus', function (evt) {
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(
          JSON.stringify({
            type: 'focus',
            value: 'title',
            sessionId:sessionId
          })
        );
      }
    });
  document.getElementById('titleInput').onpaste = function (evt) {
    onTitleChange();
  };
  document.getElementById('titleInput').onchange = function (evt) {
    onTitleChange();
  };
  document.getElementById('titleInput').onkeyup = function (evt) {
    onTitleChange();
  };
}
let titleTimeout = 0;
function onTitleChange() {
  clearTimeout(titleTimeout);
  titleTimeout = setTimeout(() => {
    if (isLoading) {
      return;
    }
    let titleMessage = {
      type: 'title',
      value: titleInput.value,
      sessionId:sessionId
    };

    info = document.querySelector(infoBar);
    if (tinymce.activeEditor) {
      info.querySelector('#infowords').innerText =
        editor.countWords() + ' words';
      updateInfoBar()
    }

    if (titleMessage && typeof titleMessage.value === 'string') {
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify(titleMessage));
      }
    }
  }, 300);
}

function autosize() {
  // let ele = document.getElementById('textCopy');
  // ele.innerHTML = document
  //   .getElementById('titleInput')
  //   .value.replace(/\n/g, '<br/>');
  // let newHeight = document.getElementById('titlebar').scrollHeight;
  // let css = document.createElement('style');
  // css.type = 'text/css';
  // let node = `
  //     .tox-tinymce {
  //       min-height:calc(100vh - ${newHeight}px) !important;
  //       };
  //  `;
  // css.appendChild(document.createTextNode(node));
  // document.getElementsByTagName('head')[0].appendChild(css);
}

function isInvalidValue(value) {
  return (
    value === '' ||
    value === '<p></p>' ||
    value === '<p><br></p>' ||
    value === '<p>&nbsp;</p>'
  );
}

function updateInfoBar() {
  let ids = ['infodate', 'infosaved'];
  ids.forEach(id => {
    let element = document.getElementById(id);
    if (!element) return;
    if (element.textContent && element.textContent !== '') {
     if (!element.classList.contains("visible")) {
        element.classList.add('visible');
      }
    } else {
      if (element.classList.contains("visible")) {
        element.classList.remove('visible');
      }
    
    }
  });
}

function attachMessageListener() {
  let isSafari = navigator.vendor.match(/apple/i);
  let listenerHandler = document;
  if (isSafari) {
    listenerHandler = window;
  }

  listenerHandler.addEventListener('message', function (data) {
    let message = JSON.parse(data.data);
    let type = message.type;
    let value = message.value;
    sessionId = message.sessionId;

    switch (type) {
      case 'inject':
        tinymce.activeEditor.setContent(value);
        break;
      case 'html':
        isLoading = true;
        globalThis.isClearingNoteData = false;
        tinymce.activeEditor.mode.set('readonly');
        if (isInvalidValue(value)) {
          tinymce.activeEditor.setContent('');
        } else {
          tinymce.activeEditor.setContent(value);
        }

        setTimeout(function () {
          document.activeElement.blur();
          window.blur();
          tinymce.activeEditor.mode.set('design');
          document.activeElement.blur();
          window.blur();
        }, 300);
        info = document.querySelector(infoBar);
        info.querySelector('#infowords').innerText =
          editor.countWords() + ' words';
          updateInfoBar()
        break;
      case 'htmldiff':
        document.getElementsByClassName('htmldiff_div')[0].innerHTML = value;
        document
          .querySelector('.htmldiff_div')
          .setAttribute('contenteditable', 'false');
        break;
      case 'theme':
        pageTheme.colors = JSON.parse(value);
        setTheme();
        break;
      case 'title':
        document.getElementById('titleInput').value = value;
        break;
      default:
        break;
    }
  });
}
