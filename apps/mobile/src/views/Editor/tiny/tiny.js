const reset = `
(() => {
editor.undoManager.clear();
editor.('', 'custom');
document.activeElement.blur();
window.blur();
editor.resetContent();
})();
`;
export const keyboardStateChanged = `(() => {
	var range = editor.getSelection();
	if (range) {
	  if (range.length == 0) {
		let correction = isTablet ? 215 : 60;
		setTimeout(() => {
		  document.querySelector('.app-main').scrollTo({
			top:
			  editor.getBounds(editor.getSelection().index).bottom -
			  (window.innerHeight - correction),
			behavior: 'smooth',
		  });
		}, 200);
	  }
	}
})();
`;
const blur = `
    document.activeElement.blur();
	window.blur();

`;

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
		editor.setContent("");
`;
const clearTitle = `
		document.getElementById(titleInput).value = '';
`;

const focusTitle = `
document.getElementById("titleInput").focus();
`;

const setTitle = (value) => `
document.getElementById(titleInput).value = '${value}';
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

const isLoading =`
isLoading = true;
`;

const html = (value) => `
isLoading = true;
editor.setContent("${value}");   
info.querySelector('#infowords').innerText =
editor.plugins.wordcount.getCount() + " words";
`;

const focusEditor = `
 editor.focus();
`;

function call(webview, func) {
  webview.current?.injectJavaScript(func);
}

const undo = `
	
editor.undoManager.undo();

`;
const redo = `
	
editor.undoManager.redo();

`;

const clearHistory = `
editor.undoManager.clear();
`;

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
  isLoading
};
