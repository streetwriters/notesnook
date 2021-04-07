import {editing} from '../../../utils';
import {EditorWebView, getWebviewInit, post} from '../Functions';

const reset = `
isLoading = true;
document.getElementById("titleInput").value = '';
autosize();
tinymce.activeEditor.setContent('');
tinymce.activeEditor.undoManager.clear();
document.activeElement.blur();
window.blur();
`;

const keyboardStateChanged = `(() => {
  window.scrollBy({
    top: 45,
    left: 0,
    behavior: 'smooth'
  })
})();
`;
const blur = `
    document.activeElement.blur();
	  window.blur();

`;

const pre = `(() => {
  function replaceContent(editor, content) {
    let rng = tinymce.activeEditor.selection.getRng();
    let node = tinymce.activeEditor.selection.getNode();
    let innerHTML = node.innerHTML;
    node.remove();
    tinymce.activeEditor.undoManager.transact(function () {
      setTimeout(() =>
        tinymce.activeEditor.execCommand("mceInsertContent", false, content(innerHTML)),2
      );
    });
    tinymce.activeEditor.selection.setRng(rng, true);
    tinymce.activeEditor.nodeChanged();
  };

  let node = tinymce.activeEditor.selection.getNode();
  const innerTexts = node.textContent;
  if (innerTexts.length <= 0) {
    replaceContent(
      tinymce.activeEditor,
      (html) => {
        let replant = html.replace(regex, "<br>");
        return "<p>" + replant + "</p>"
      }
    );
  } else {
    tinymce.activeEditor.execCommand("mceInsertNewLine", false, { shiftKey: true });
  }
})();`

const updateDateEdited = (value) => `
	(() => {
		info = document.querySelector(infoBar);
        info.querySelector('#infodate').innerText = "${value}";
        info.querySelector('#infowords').innerText =
		editor.plugins.wordcount.getCount() + " words";
		
	})();
`;

const updateSavingState = (value) => `
	(() => {
		info = document.querySelector(infoBar);
        info.querySelector('#infosaved').innerText = "${value}";
	})();
`;

export const clearEditor = `
tinymce.activeEditor.setContent("");
`;
const clearTitle = `
    document.getElementById(titleInput).value = '';
    autosize();
`;

const focusTitle = `
document.getElementById("titleInput").focus();
`;

const setTitle = (value) => `
document.getElementById("titleInput").value = \`${value}\`;
autosize();
`;

const cacheRange = `current_selection_range = editor.selection.getRng();`;
const restoreRange = `editor.selection.setRng(current_selection_range);`;
const clearRange = `current_selection_range = null`;

const toggleFormat = (format) => {
  let command = `
	tinymce.activeEditor.execCommand(${format});
	`;

  return command;
};

const formatWithValue = (format, value) => {
  let command = `
	tinymce.activeEditor.execCommand(${format},false, '${value}');
	  `;
  return command;
};

export const nomenu = (enabled) => `
	(() => {
		let isenabled = ${enabled};
        let titleIn = document.getElementById('titlebar');
        if (isenabled) {
          titleIn.style['padding-left'] = 12;
          titleIn.style['padding-right'] = window.innerWidth * 0.4;
        } else {
          titleIn.style['padding-left'] = 60;
          titleIn.style['padding-right'] = window.innerWidth * 0.4;
        }
	})();
`;
const updateTheme = (value) => `
(() => {
  let v = ${value}
  pageTheme.colors = v;
  setTheme();
})();

`;

const isLoading = `
isLoading = true;
`;

const notLoading = `
isLoading = false;
`;

const html = (value) => post('html', value);

const focusEditor = `
tinymce.activeEditor.focus();
`;

function call(webview, func, noqueue) {
  if (getWebviewInit()) {
    webview.current?.injectJavaScript(func);
  } else {
    if (noqueue) return;
    setTimeout(() => {
      console.log('run after delay');
      webview.current?.injectJavaScript(func);
    }, 1000);
  }
}

const undo = `
	
tinymce.activeEditor.undoManager.undo();

`;
const redo = `
	
tinymce.activeEditor.undoManager.redo();

`;

const clearHistory = `
tinymce.activeEditor.undoManager.clear();
`;

const onKeyboardShow = () => {
  if (!editing.movedAway) {
    editing.isFocused = true;
    call(EditorWebView, keyboardStateChanged);
  }
};

export default {
  undo,
  redo,
  clearHistory,
  call,
  focusEditor,
  html,
  toggleFormat,
  formatWithValue,
  cacheRange,
  clearRange,
  blur,
  reset,
  clearTitle,
  focusTitle,
  updateDateEdited,
  updateSavingState,
  updateTheme,
  setTitle,
  restoreRange,
  isLoading,
  notLoading,
  keyboardStateChanged,
  onKeyboardShow,
  pre
};
