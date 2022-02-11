import { Platform } from 'react-native';
import { editing } from '../../../utils';
import { EditorWebView, getWebviewInit, post, textInput } from '../Functions';

/**
 *
 * @param {"design" | "readonly"} mode
 * @returns
 */
const toogleReadMode = mode => `tinymce.activeEditor.mode.set('${mode}')`;

const reset = id => `
sessionId = null;
document.getElementById("titleInput").value = '';
document.getElementById("titleInput").placeholder = "Note title";
tinymce.activeEditor.mode.set('readonly');
tinymce.activeEditor.clearContent();
tinymce.activeEditor.setHTML("<p><br/></p>");
editor.dom.setAttrib(editor.dom.doc.body, 'data-mce-placeholder', 'Start writing your note here');
editor.dom.setAttrib(editor.dom.doc.body, 'aria-placeholder', 'Start writing your note here');
renderChildernInNode([], ".tag-bar");
tinymce.activeEditor.undoManager.clear();
document.querySelector('#infosaved').innerText = "";
document.querySelector('#infodate').innerText = "";
document.querySelector('#infowords').innerText = "0 words"
updateInfoBar();
reactNativeEventHandler('resetcomplete');
tinymce.activeEditor.mode.set('design');
document.activeElement.blur();
window.blur();
toggleNode(".tag-bar-parent","hide"); 
clearNode(".tag-bar");
`;

const setPlaceholder = placeholder => `
editor.dom.setAttrib(editor.dom.doc.body, 'data-mce-placeholder', '${placeholder}');
editor.dom.setAttrib(editor.dom.doc.body, 'aria-placeholder', '${placeholder}');
`;

const removeMarkdown = `
if (globalThis.tinymce && tinymce.activeEditor) {
  
  tinymce.activeEditor.plugins.textpattern.setPatterns("")
}`;

const setMarkdown = `
if (globalThis.tinymce && tinymce.activeEditor) {
  tinymce.activeEditor.plugins.textpattern.setPatterns(markdownPatterns);
}`;

const keyboardStateChanged = `(function() {
  setTimeout(function() {
    let node = tinymce.activeEditor.selection.getNode();
    if (node.nodeName === "IMG" || node.nodeName === "BODY" ) return;
    node.scrollIntoView({behavior: "smooth", block: "end"});
  },100)
})();
`;
const blur = `
    document.activeElement.blur();
	  window.blur();
`;

const pre = `(function() {
  function replaceContent(editor, content) {
    let rng = tinymce.activeEditor.selection.getRng();
    let node = tinymce.activeEditor.selection.getNode();
    let innerHTML = node.innerHTML;
    node.remove();
    tinymce.activeEditor.undoManager.transact(function () {
      setTimeout(function() {
        tinymce.activeEditor.execCommand("mceInsertContent", false, content(innerHTML)),2
      });
    });
    tinymce.activeEditor.selection.setRng(rng, true);
    tinymce.activeEditor.fire("input");
  };

  let node = tinymce.activeEditor.selection.getNode();
  const innerTexts = node.textContent;
  if (innerTexts.length <= 0) {
    replaceContent(
      tinymce.activeEditor,
      function(html) {
        let replant = html.replace(regex, "<br>");
        return "<p>" + replant + "</p>"
      }
    );
  } else {
    tinymce.activeEditor.execCommand("mceInsertNewLine", false, { shiftKey: true });
  }
})();`;

const updateDateEdited = value => `
	(function() {
		info = document.querySelector(infoBar);
        info.querySelector('#infodate').innerText = "${value}";
        updateInfoBar()
	})();
`;

const updateSavingState = value => `
	(function() {
		info = document.querySelector(infoBar);
    info.querySelector('#infosaved').innerText = "${value}";
    updateInfoBar()
	})();
`;

export const clearEditor = `

tinymce.activeEditor.setHTML("");
`;
const clearTitle = `
    document.getElementById(titleInput).value = '';
    autosize();
`;

const focusTitle = `
document.getElementById("titleInput").focus();
`;

const setTitle = value => `
document.getElementById("titleInput").value = \`${value}\`;
autosize();
`;

const cacheRange = `current_selection_range = editor.selection.getRng();`;
const restoreRange = `editor.selection.setRng(current_selection_range);`;
const clearRange = `current_selection_range = null`;

const toggleFormat = format => {
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

export const nomenu = enabled => `
	(function() {
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
const updateTheme = value => `
(function() {
  let v = ${value}
  if (pageTheme) {
    pageTheme.colors = v;
  }
  if (globalThis.tinymce && tinymce.activeEditor) {
    setTheme();
  }
 
})();

`;

const isLoading = `
isLoading = true;
`;

const notLoading = `
isLoading = false;
`;

const html = value => post('html', value);

const focusEditor = `
 tinymce.activeEditor.focus();
`;

function call(webview, func, noqueue) {
  if (getWebviewInit()) {
    webview.current?.injectJavaScript(func);
  } else {
    if (noqueue) return;
    setTimeout(() => {
      webview.current?.injectJavaScript(func);
    }, 1000);
  }
}

export function safeKeyboardDismiss() {
  console.log('keyboard state', editing.keyboardState);
  if (!editing.keyboardState) return;
  if (Platform.OS === 'android') {
    textInput.current?.focus();
    textInput.current?.blur();
  } else {
    call(EditorWebView, blur);
  }
}

const undo = `
tinymce.activeEditor.undoManager.undo();
`;
const redo = `tinymce.activeEditor.undoManager.redo();`;

const clearHistory = `tinymce.activeEditor.undoManager.clear();`;

const onKeyboardShow = () => {
  if (!editing.movedAway) {
    editing.isFocused = true;
    if (Platform.OS === 'ios') {
      if (editing.focusType === 'title') return;
      call(EditorWebView, keyboardStateChanged);
    }
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
  pre,
  setMarkdown,
  removeMarkdown,
  setPlaceholder,
  toogleReadMode
};
