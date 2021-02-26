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
    factor: 1,
  },
};

const markdownPatterns = [
  { start: "*", end: "*", format: "italic" },
  { start: "**", end: "**", format: "bold" },
  { start: "`", end: "`", format: "code" },
  { start: "#", format: "h1" },
  { start: "##", format: "h2" },
  { start: "###", format: "h3" },
  { start: "####", format: "h4" },
  { start: "#####", format: "h5" },
  { start: "######", format: "h6" },
  { start: "* ", cmd: "InsertUnorderedList" },
  { start: "- ", cmd: "InsertUnorderedList" },
  { start: "> ", format: "blockquote" },
  {
    start: "1. ",
    cmd: "InsertOrderedList",
    value: { "list-style-type": "decimal" },
  },
  {
    start: "1) ",
    cmd: "InsertOrderedList",
    value: { "list-style-type": "decimal" },
  },
  {
    start: "a. ",
    cmd: "InsertOrderedList",
    value: { "list-style-type": "lower-alpha" },
  },
  {
    start: "a) ",
    cmd: "InsertOrderedList",
    value: { "list-style-type": "lower-alpha" },
  },
  {
    start: "i. ",
    cmd: "InsertOrderedList",
    value: { "list-style-type": "lower-roman" },
  },
  {
    start: "i) ",
    cmd: "InsertOrderedList",
    value: { "list-style-type": "lower-roman" },
  },
  { start: "---", replacement: "<hr/>" },
  { start: "--", replacement: "—" },
  { start: "-", replacement: "—" },
  { start: "(c)", replacement: "©" },
];


function dark() {
  if (!tinymce.activeEditor) return;
  tinymce.activeEditor.dom.styleSheetLoader.unload(
    'dist/skins/notesnook/content.min.css',
  );
  tinymce.activeEditor.dom.styleSheetLoader.load(
    'dist/skins/notesnook-dark/content.min.css',
  );
  tinymce.activeEditor.ui.styleSheetLoader.unload(
    'dist/skins/notesnook/skin.min.css',
  );
  tinymce.activeEditor.ui.styleSheetLoader.load(
    'dist/skins/notesnook-dark/skin.min.css',
  );
}

function light() {
  if (!tinymce.activeEditor) return;
  tinymce.activeEditor.dom.styleSheetLoader.unload(
    'dist/skins/notesnook-dark/content.min.css',
  );
  tinymce.activeEditor.dom.styleSheetLoader.load(
    'dist/skins/notesnook/content.min.css',
  );
  tinymce.activeEditor.ui.styleSheetLoader.unload(
    'dist/skins/notesnook-dark/skin.min.css',
  );
  tinymce.activeEditor.ui.styleSheetLoader.load(
    'dist/skins/notesnook/skin.min.css',
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
	  `;
  css.appendChild(document.createTextNode(node));
  document.getElementsByTagName('head')[0].appendChild(css);
}

var minifyImg = function (
  dataUrl,
  newWidth,
  imageType = 'image/jpeg',
  resolve,
  imageArguments = 0.7,
) {
  var image, oldWidth, oldHeight, newHeight, canvas, ctx, newDataUrl;
  new Promise(function (resolve) {
    image = new Image();
    image.src = dataUrl;
    
    resolve('Done : ');
  }).then((d) => {
    oldWidth = image.width;
    oldHeight = image.height;
    newHeight = Math.floor((oldHeight / oldWidth) * newWidth);
    canvas = document.createElement('canvas');
    canvas.width = newWidth;
    canvas.height = newHeight;
    ctx = canvas.getContext('2d');
    ctx.drawImage(image, 0, 0, newWidth, newHeight);
    newDataUrl = canvas.toDataURL(imageType, imageArguments);
    resolve(newDataUrl);
  });
};

function loadImage() {
  let fileInput = document.querySelector('#image-input');
  let listener = () => {
    if (fileInput.files != null && fileInput.files[0] != null) {
      let reader = new FileReader();
      console.log(reader.readyState, 'READY STATE');
      let load = (e) => {
        console.log(e, 'loaded error');
        minifyImg(
          reader.result,
          1024,
          'image/jpeg',
          (r) => {
            var content = `<img style="max-width:100% !important;" src="${r}">`;
            editor.insertContent(content);
          },
          0.8,
        );
        fileInput.removeEventListener('change', listener);
        reader.removeEventListener('load', load);
      };
      let error = () => {
        console.log('error');
        reader.onload = null;
        fileInput.removeEventListener('change', listener);
        reader.removeEventListener('load', load);
        reader.removeEventListener('error', error);
      };
      reader.onabort = () => {
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
