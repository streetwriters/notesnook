let pageTheme = {
  colors: {
    accent: '#00c853',
    shade: '#00c85312',
    fg: '#00c853',
    normal: 'black',
    icon: 'gray',
    errorBg: '#FFD2D2',
    errorText: '#D8000C',
    successBg: '#DFF2BF',
    successText: '#4F8A10',
    warningBg: '#FEEFB3',
    warningText: '#9F6000',
    night: false,
    bg: 'white',
    navbg: '#f6fbfc',
    nav: '#f0f0f0',
    pri: 'black',
    sec: 'white',
    factor: 1
  }
};

const markdownPatterns = [
  {start: '*', end: '*', format: 'italic'},
  {start: '**', end: '**', format: 'bold'},
  {start: '`', end: '`', format: 'code'},
  {start: '#', format: 'h1'},
  {start: '##', format: 'h2'},
  {start: '###', format: 'h3'},
  {start: '####', format: 'h4'},
  {start: '#####', format: 'h5'},
  {start: '######', format: 'h6'},
  {start: '* ', cmd: 'InsertUnorderedList'},
  {start: '- [ ] ', cmd: 'InsertCheckList'},
  {start: '- [x] ', cmd: 'InsertCheckList', value: 'checked'},
  {start: '- ', cmd: 'InsertUnorderedList'},
  {start: '> ', format: 'blockquote'},
  {
    start: '1. ',
    cmd: 'InsertOrderedList',
    value: {'list-style-type': 'decimal'}
  },
  {
    start: '1) ',
    cmd: 'InsertOrderedList',
    value: {'list-style-type': 'decimal'}
  },
  {
    start: 'a. ',
    cmd: 'InsertOrderedList',
    value: {'list-style-type': 'lower-alpha'}
  },
  {
    start: 'a) ',
    cmd: 'InsertOrderedList',
    value: {'list-style-type': 'lower-alpha'}
  },
  {
    start: 'i. ',
    cmd: 'InsertOrderedList',
    value: {'list-style-type': 'lower-roman'}
  },
  {
    start: 'i) ',
    cmd: 'InsertOrderedList',
    value: {'list-style-type': 'lower-roman'}
  },
  {start: '---', replacement: '<hr/>'},
  {start: '--', replacement: '—'},
  {start: '(c)', replacement: '©'}
];

function dark() {
  if (document.getElementById('dark_sheet')) {
    document.getElementById('dark_sheet').removeAttribute('disabled');
    document.getElementById('light_sheet').setAttribute('disabled');
  }

  if (!tinymce.activeEditor) return;
  tinymce.activeEditor.dom.styleSheetLoader.unload(
    'dist/skins/notesnook/content.min.css'
  );
  tinymce.activeEditor.dom.styleSheetLoader.load(
    'dist/skins/notesnook-dark/content.min.css'
  );
  tinymce.activeEditor.ui.styleSheetLoader.unload(
    'dist/skins/notesnook/skin.min.css'
  );
  tinymce.activeEditor.ui.styleSheetLoader.load(
    'dist/skins/notesnook-dark/skin.min.css'
  );
}

function light() {
  if (document.getElementById('dark_sheet')) {
    document.getElementById('dark_sheet').setAttribute('disabled');
    document.getElementById('light_sheet').removeAttribute('disabled');
  }

  if (!tinymce.activeEditor) return;
  tinymce.activeEditor.dom.styleSheetLoader.unload(
    'dist/skins/notesnook-dark/content.min.css'
  );
  tinymce.activeEditor.dom.styleSheetLoader.load(
    'dist/skins/notesnook/content.min.css'
  );
  tinymce.activeEditor.ui.styleSheetLoader.unload(
    'dist/skins/notesnook-dark/skin.min.css'
  );
  tinymce.activeEditor.ui.styleSheetLoader.load(
    'dist/skins/notesnook/skin.min.css'
  );
}

function setTheme() {
  if (pageTheme.colors.night) {
    dark();
  } else {
    light();
  }

  let css = document.createElement('style');
  css.type = 'text/css';

  let node = `
	#titleInput {
	  color:${pageTheme.colors.heading};
	  font-size:${32 * pageTheme.colors.factor};
	}
  
	#textCopy {
	  color:${pageTheme.colors.pri};
	  font-size:${32 * pageTheme.colors.factor};
	}
	#titleInput::-webkit-input-placeholder {
	  color:${pageTheme.colors.icon}
	}

	.info-bar {
	  color:${pageTheme.colors.icon};
	}
	  #titlebar {
		display:flex !important;
	  }
    
    .tox .tox-tbtn:hover {
      background: ${pageTheme.colors.shade} !important;
    }
    
    .tox-textfield {
      border-radius: 0px !important;
      border-color: ${pageTheme.colors.nav} !important;
      border-width: 0px 0px 2px 0px !important;
      color: var(--text) !important;
      padding: 10px !important;
      font-size: 0.875rem !important;
      line-height: 0.875rem !important;
    }
    
    .tox-textfield:focus {
      outline: none !important;
      border-color: ${pageTheme.colors.accent} !important;
      border-width: 0px 0px 2px 0px !important;
      border-radius: 0px !important;
    }
    
    .tox-textfield:hover {
      border-color: ${pageTheme.colors.accent + '80'} !important;
    }
    
    .tox-button {
      background-color: ${pageTheme.colors.accent} !important;
      color: white;
      transition: opacity 300ms linear;
      border-width: 0px !important;
    }
    
    .tox-button:hover:not(.tox-button[disabled="disabled"]) {
      opacity: 0.8;
    }
    
    .tox-button--secondary,
    .tox-button--icon {
      background-color: ${pageTheme.colors.nav} !important;
      color: ${pageTheme.colors.icon} !important;
    }
    .tox-button[disabled="disabled"] {
      background-color:  ${pageTheme.colors.nav}  !important;
      color: ${pageTheme.colors.icon} !important;
    }
    
    tox-tbtn tox-tbtn--select {
      border-radius: 5px !important;
    }
    
    .tox-dialog {
      border-radius: 5px !important;
      border-width: 0px !important;
      box-shadow: 4px 5px 18px 2px #00000038;
      padding: 0px !important;
      max-width: 95vw !important;
      margin-left:2.5vw,
      margin-right:2.5vw,
      align-self:center !important;
    }
    
    .tox-dialog__footer {
      border-top: 0px !important;
    }
    
    .tox-dialog__title {
      color: ${pageTheme.colors.pri} !important;
      font-size: 1.2rem !important;
      font-weight: bold !important;
    }
    
    .tox .tox-toolbar,
    .tox .tox-toolbar__overflow,
    .tox .tox-toolbar__primary {
      background: none !important;
      border-bottom: 1px solid ${pageTheme.colors.nav} !important;
    }

  
	  `;

  let node2 = `
  .mce-content-body audio[data-mce-selected], 
  .mce-content-body embed[data-mce-selected], 
  .mce-content-body img[data-mce-selected], 
  .mce-content-body object[data-mce-selected], 
  .mce-content-body table[data-mce-selected], 
  .mce-content-body video[data-mce-selected] {
    outline: 3px solid ${pageTheme.colors.shade} !important;
}


.mce-content-body div.mce-resizehandle {
  background-color: ${pageTheme.colors.accent} !important;
  border-color:  ${pageTheme.colors.accent} !important;
  border-style: solid;
  border-width: 1px;
  box-sizing: border-box;
  height: 30px !important;
  position: absolute;
  width: 30px !important;
  z-index: 10000;
  opacity:0.5;
}`;

  /*

#mceResizeHandlese {
  height: 40px !important;
  width: 40px !important;
  border-radius:100px !important;
} */

  let editorHead = tinymce.activeEditor.contentDocument.getElementsByTagName(
    'head'
  )[0];
  let css2 = document.createElement('style');
  css2.appendChild(document.createTextNode(node2));
  editorHead.appendChild(css2);

  css.appendChild(document.createTextNode(node));
  document.getElementsByTagName('head')[0].appendChild(css);
}

var minifyImg = function (
  dataUrl,
  newWidth,
  imageType = 'image/jpeg',
  resolve,
  imageArguments = 0.7
) {
  fetch(dataUrl).then(function (res) {
    res.blob().then(function (blob) {
      new Compressor(blob, {
        quality: imageArguments,
        width: newWidth,
        mimeType: imageType,
        success: function (result) {
          let fileReader = new FileReader();
          fileReader.onloadend = function () {
            resolve(fileReader.result);
            fileReader.onloadend = null;
          };
          fileReader.readAsDataURL(result);
        },
        error: function (err) {
          console.log(err.message);
        }
      });
    });
  });
};

function loadImage() {
  let fileInput = document.querySelector('#image-input');
  let listener = function () {
    if (fileInput.files != null && fileInput.files[0] != null) {
      let reader = new FileReader();
      console.log(reader.readyState, 'READY STATE');
      let load = function (e) {
        console.log(e, 'loaded error');
        minifyImg(
          reader.result,
          1024,
          'image/jpeg',
          function (r) {
            var content = `<img style="max-width:100% !important;" src="${r}">`;
            editor.insertContent(content);
          },
          0.6
        );
        fileInput.removeEventListener('change', listener);
        reader.removeEventListener('load', load);
      };
      let error = function () {
        console.log('error');
        reader.onload = null;
        fileInput.removeEventListener('change', listener);
        reader.removeEventListener('load', load);
        reader.removeEventListener('error', error);
      };
      reader.onabort = function () {
        console.log('abort');
      };
      reader.addEventListener('load', load);
      reader.addEventListener('error', error);
      reader.readAsDataURL(fileInput.files[0]);
    }
  };

  fileInput.addEventListener('change', listener);
  fileInput.click();
}
