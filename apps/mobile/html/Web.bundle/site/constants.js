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
  {start: '- [ ] ', cmd: 'insertCheckList'},
  {start: '- [x] ', cmd: 'insertCheckList', value: 'checked'},
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
  addStyle();

  let css = document.createElement('style');
  css.type = 'text/css';

  let node = `
	#titleInput {
	  color:${pageTheme.colors.heading};
	  font-size:${25 * pageTheme.colors.factor};
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

    .tox .tox-tbtn--select {
      min-width: 120px;
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

    ::selection {
      color: white !important;
      background: ${pageTheme.colors.accent} !important;
    }
    
    
 
    `;

  let node2 = `
  .mce-content-body table[data-mce-selected], {
    outline: 3px solid ${pageTheme.colors.shade} !important;
}

.mce-content-body audio[data-mce-selected], 
  .mce-content-body embed[data-mce-selected], 
  .mce-content-body img[data-mce-selected], 
  .mce-content-body object[data-mce-selected], 
  .mce-content-body video[data-mce-selected] {
    outline: 3px solid ${pageTheme.colors.shade} !important;
    border-radius:5px;
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
}

.mce-content-body a {
  color: ${pageTheme.colors.accent} !important;
}

.mce-content-body [data-mce-selected="inline-boundary"] {
  background-color: ${pageTheme.colors.shade} !important;
}

::selection {
  color: white !important;
  background: ${pageTheme.colors.accent} !important;
}
  

.mce-content-body a[data-mce-selected] {
  box-shadow: none !important;
}

span.attachment {
  overflow: hidden;
  position: relative;
  z-index: 1;
  user-select: none;
  display: inline-flex;
  align-items: center;
  background-color: ${pageTheme.colors.nav};
  padding: 0px 5px 0px 22px;
  border-radius: 3px;
  border: 1px solid var(--border);
  font-size: 0.85rem;
  cursor: pointer !important;
  word-break: break-all;
  max-width: 250px;
}

span.attachment .filename {
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
}

span.attachment:not([data-progress])::after {
  content: attr(data-size);
  color: ${pageTheme.colors.icon};
  margin-left: 5px;
  font-size: 0.7rem;
  white-space: nowrap;
}

span.attachment[data-progress]::after {
  content: attr(data-progress);
  color:${pageTheme.colors.icon};
  margin-left: 5px;
  font-size: 0.7rem;
  white-space: nowrap;
}

span.attachment::before {
  display: inline-block;
  z-index: -1;
  position: absolute;
  top: 0;
  left: 0;
  content: "";
  width: var(--progress, 0px);
  height: 100%;
  transition: width 100ms ease-in;
  background-size: 15px 15px;
  background-repeat: no-repeat;
  background-position: 5px 1.5px;
  background-color: var(--border);
}

span.attachment em::before {
  content: "";
  position: absolute;
  width: 15px;
  height: 15px;
  left: 5px;
  top: 1.5px;
  background-color: ${pageTheme.colors.pri};
  -webkit-mask-size: 15px 15px;
  -webkit-mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' height='24' width='24'%3E%3Cpath d='M7.5,18A5.5,5.5 0 0,1 2,12.5A5.5,5.5 0 0,1 7.5,7H18A4,4 0 0,1 22,11A4,4 0 0,1 18,15H9.5A2.5,2.5 0 0,1 7,12.5A2.5,2.5 0 0,1 9.5,10H17V11.5H9.5A1,1 0 0,0 8.5,12.5A1,1 0 0,0 9.5,13.5H18A2.5,2.5 0 0,0 20.5,11A2.5,2.5 0 0,0 18,8.5H7.5A4,4 0 0,0 3.5,12.5A4,4 0 0,0 7.5,16.5H17V18H7.5Z'%3E%3C/path%3E%3C/svg%3E");
  mask-size: 15px 15px;
  mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' height='24' width='24'%3E%3Cpath d='M7.5,18A5.5,5.5 0 0,1 2,12.5A5.5,5.5 0 0,1 7.5,7H18A4,4 0 0,1 22,11A4,4 0 0,1 18,15H9.5A2.5,2.5 0 0,1 7,12.5A2.5,2.5 0 0,1 9.5,10H17V11.5H9.5A1,1 0 0,0 8.5,12.5A1,1 0 0,0 9.5,13.5H18A2.5,2.5 0 0,0 20.5,11A2.5,2.5 0 0,0 18,8.5H7.5A4,4 0 0,0 3.5,12.5A4,4 0 0,0 7.5,16.5H17V18H7.5Z'%3E%3C/path%3E%3C/svg%3E");
}

.mce-content-body code[data-mce-selected="inline-boundary"] {
  background-color: ${pageTheme.colors.nav} !important;
}

.mce-content-body code {
  background-color: ${pageTheme.colors.nav} !important;
  border: 1px solid var(--border);
  border-radius: 5px;
  padding: 3px 5px 0px 5px;
}

code {
  font-family: ui-monospace, SFMono-Regular, SF Mono, Consolas, Liberation Mono,
    Menlo, monospace !important;
  font-size:10pt !important
}

`;
  if (tinymce.activeEditor) {
    let editorHead =
      tinymce.activeEditor.contentDocument.getElementsByTagName('head')[0];
    let css2 = document.createElement('style');
    css2.appendChild(document.createTextNode(node2));
    editorHead.appendChild(css2);
  }

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
