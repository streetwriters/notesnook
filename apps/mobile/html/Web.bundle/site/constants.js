let requiring = null;
const pageTheme = {
    colors: {
        accent: '#0560FF',
        shade: '#0560FF12',
        fg: '#0560FF',
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
}

const setTheme = function () {


    let css = document.createElement('style');
    css.type = 'text/css';

    let node = `
    .ql-snow.ql-toolbar button.ql-active,
    .ql-snow .ql-toolbar button.ql-active,
    .ql-snow.ql-toolbar .ql-picker-label:hover,
    .ql-snow .ql-toolbar .ql-picker-label:hover,
    .ql-snow.ql-toolbar .ql-picker-label.ql-active,
    .ql-snow .ql-toolbar .ql-picker-label.ql-active {
      color: ${pageTheme.colors.accent} !important;
      background-color:${pageTheme.colors.shade} ;
      border-radius:5px;
    }

    .ql-snow.ql-toolbar button {
      background-color:transparent;
      padding-right:6px;
      padding-left:6px;
      padding-top:2px;
      padding-bottom:3px
    }


    .ql-snow.ql-toolbar .ql-picker-item:hover,
    .ql-snow .ql-toolbar .ql-picker-item:hover,
    .ql-snow.ql-toolbar .ql-picker-item.ql-selected,
    .ql-snow .ql-toolbar .ql-picker-item.ql-selected {
      color: ${pageTheme.colors.accent} !important;
      background-color:${pageTheme.colors.shade} ;
    }
    .ql-snow.ql-toolbar button:hover .ql-fill,
    .ql-snow .ql-toolbar button:hover .ql-fill,
    .ql-snow.ql-toolbar button:focus .ql-fill,
    .ql-snow .ql-toolbar button:focus .ql-fill,
    .ql-snow.ql-toolbar button.ql-active .ql-fill,
    .ql-snow .ql-toolbar button.ql-active .ql-fill,
    .ql-snow.ql-toolbar .ql-picker-label:hover .ql-fill,
    .ql-snow .ql-toolbar .ql-picker-label:hover .ql-fill,
    .ql-snow.ql-toolbar .ql-picker-label.ql-active .ql-fill,
    .ql-snow .ql-toolbar .ql-picker-label.ql-active .ql-fill,
    .ql-snow.ql-toolbar .ql-picker-item:hover .ql-fill,
    .ql-snow .ql-toolbar .ql-picker-item:hover .ql-fill,
    .ql-snow.ql-toolbar .ql-picker-item.ql-selected .ql-fill,
    .ql-snow .ql-toolbar .ql-picker-item.ql-selected .ql-fill,
    .ql-snow.ql-toolbar button:hover .ql-stroke.ql-fill,
    .ql-snow .ql-toolbar button:hover .ql-stroke.ql-fill,
    .ql-snow.ql-toolbar button:focus .ql-stroke.ql-fill,
    .ql-snow .ql-toolbar button:focus .ql-stroke.ql-fill,
    .ql-snow.ql-toolbar button.ql-active .ql-stroke.ql-fill,
    .ql-snow .ql-toolbar button.ql-active .ql-stroke.ql-fill,
    .ql-snow.ql-toolbar .ql-picker-label:hover .ql-stroke.ql-fill,
    .ql-snow .ql-toolbar .ql-picker-label:hover .ql-stroke.ql-fill,
    .ql-snow.ql-toolbar .ql-picker-label.ql-active .ql-stroke.ql-fill,
    .ql-snow .ql-toolbar .ql-picker-label.ql-active .ql-stroke.ql-fill,
    .ql-snow.ql-toolbar .ql-picker-item:hover .ql-stroke.ql-fill,
    .ql-snow .ql-toolbar .ql-picker-item:hover .ql-stroke.ql-fill,
    .ql-snow.ql-toolbar .ql-picker-item.ql-selected .ql-stroke.ql-fill,
    .ql-snow .ql-toolbar .ql-picker-item.ql-selected .ql-stroke.ql-fill,
    .ql-snow.ql-toolbar button.ql-active svg
    {
      fill: ${pageTheme.colors.accent} !important;
    }
    .ql-snow.ql-toolbar button:hover .ql-stroke,
    .ql-snow .ql-toolbar button:hover .ql-stroke,
    .ql-snow.ql-toolbar button:focus .ql-stroke,
    .ql-snow .ql-toolbar button:focus .ql-stroke,
    .ql-snow.ql-toolbar button.ql-active .ql-stroke,
    .ql-snow .ql-toolbar button.ql-active .ql-stroke,
    .ql-snow.ql-toolbar .ql-picker-label:hover .ql-stroke,
    .ql-snow .ql-toolbar .ql-picker-label:hover .ql-stroke,
    .ql-snow.ql-toolbar .ql-picker-label.ql-active .ql-stroke,
    .ql-snow .ql-toolbar .ql-picker-label.ql-active .ql-stroke,
    .ql-snow.ql-toolbar .ql-picker-item:hover .ql-stroke,
    .ql-snow .ql-toolbar .ql-picker-item:hover .ql-stroke,
    .ql-snow.ql-toolbar .ql-picker-item.ql-selected .ql-stroke,
    .ql-snow .ql-toolbar .ql-picker-item.ql-selected .ql-stroke,
    .ql-snow.ql-toolbar button:hover .ql-stroke-miter,
    .ql-snow .ql-toolbar button:hover .ql-stroke-miter,
    .ql-snow.ql-toolbar button:focus .ql-stroke-miter,
    .ql-snow .ql-toolbar button:focus .ql-stroke-miter,
    .ql-snow.ql-toolbar button.ql-active .ql-stroke-miter,
    .ql-snow .ql-toolbar button.ql-active .ql-stroke-miter,
    .ql-snow.ql-toolbar .ql-picker-label:hover .ql-stroke-miter,
    .ql-snow .ql-toolbar .ql-picker-label:hover .ql-stroke-miter,
    .ql-snow.ql-toolbar .ql-picker-label.ql-active .ql-stroke-miter,
    .ql-snow .ql-toolbar .ql-picker-label.ql-active .ql-stroke-miter,
    .ql-snow.ql-toolbar .ql-picker-item:hover .ql-stroke-miter,
    .ql-snow .ql-toolbar .ql-picker-item:hover .ql-stroke-miter,
    .ql-snow.ql-toolbar .ql-picker-item.ql-selected .ql-stroke-miter,
    .ql-snow .ql-toolbar .ql-picker-item.ql-selected .ql-stroke-miter {
      stroke: ${pageTheme.colors.accent} !important;
    }


  .ql-editor ul[data-checked='true'] > li::before,
  .ql-editor ul[data-checked='false'] > li::before {
    color: #777;
    cursor: pointer;
    pointer-events: all;
  }

  @media (pointer: coarse) {
    .ql-snow.ql-toolbar button:hover:not(.ql-active),
    .ql-snow .ql-toolbar button:hover:not(.ql-active) {
      color: ${pageTheme.colors.icon};
    }
    .ql-snow.ql-toolbar button:hover:not(.ql-active) .ql-fill,
    .ql-snow .ql-toolbar button:hover:not(.ql-active) .ql-fill,
    .ql-snow.ql-toolbar button:hover:not(.ql-active) .ql-stroke.ql-fill,
    .ql-snow .ql-toolbar button:hover:not(.ql-active) .ql-stroke.ql-fill {
      fill: ${pageTheme.colors.icon};
    }
    .ql-snow.ql-toolbar button:hover:not(.ql-active) .ql-stroke,
    .ql-snow .ql-toolbar button:hover:not(.ql-active) .ql-stroke,
    .ql-snow.ql-toolbar button:hover:not(.ql-active) .ql-stroke-miter,
    .ql-snow .ql-toolbar button:hover:not(.ql-active) .ql-stroke-miter {
      stroke: ${pageTheme.colors.icon};
    }
  }
  
  .ql-snow .ql-stroke {
    fill: none;
    stroke: ${pageTheme.colors.icon};
    stroke-linecap: round;
    stroke-linejoin: round;
    stroke-width: 2;
  }
  .ql-snow .ql-stroke-miter {
    fill: none;
    stroke: ${pageTheme.colors.icon};
    stroke-miterlimit: 10;
    stroke-width: 2;
  }
  .ql-snow .ql-fill,
  .ql-snow .ql-stroke.ql-fill {
    fill: ${pageTheme.colors.icon};
  }
  
  .ql-snow .ql-editor blockquote {
    border-left: 4px solid ${pageTheme.colors.nav};
    margin-bottom: 5px;
    margin-top: 5px;
    padding-left: 16px;
  }
  .ql-snow .ql-editor code,
  .ql-snow .ql-editor pre {
    background-color: ${pageTheme.colors.nav};
    border-radius: 3px;
    color:${pageTheme.colors.icon}
  }
  
  .ql-snow .ql-editor pre.ql-syntax {
    background-color: ${pageTheme.colors.nav};
    color: 'black';
    overflow: visible;
  }
  
  .ql-snow .ql-picker {
    color: ${pageTheme.colors.icon};
    display: inline-block;
    float: left;
    font-size:${(pageTheme.colors.factor * 13)};
    font-weight: 500;
    position: relative;
    vertical-align: middle;
  }
  
  .ql-snow .ql-picker-options {
    background-color: ${pageTheme.colors.nav};
    display: none;
    min-width: inherit;
    padding: 0px;
    position: fixed;
  }
  .ql-snow .ql-picker .ql-picker-label {
    color: ${pageTheme.colors.icon};
  }
  .ql-snow .ql-picker.ql-expanded .ql-picker-label {
    color: ${pageTheme.colors.icon};
  
  }
  .ql-snow .ql-picker.ql-expanded .ql-picker-label .ql-fill {
    fill: ${pageTheme.colors.icon};
  }
  .ql-snow .ql-picker.ql-expanded .ql-picker-label .ql-stroke {
    stroke: ${pageTheme.colors.icon};
  }

  
  .ql-snow .ql-color-picker.ql-background .ql-picker-item {
    background-color: ${pageTheme.colors.bg};
  }
  .ql-snow .ql-color-picker.ql-color .ql-picker-item {
    background-color: ${pageTheme.colors.sec};
  }

  .ql-toolbar.ql-snow .ql-picker-options {
    box-shadow: rgba(0, 0, 0, 0.2) 0 2px 8px;
  }
  .ql-toolbar.ql-snow .ql-picker.ql-expanded .ql-picker-label {
    border-color: ${pageTheme.colors.nav};
  }
  .ql-toolbar.ql-snow .ql-picker.ql-expanded .ql-picker-options {
    border-color: ${pageTheme.colors.nav};
  }
  .ql-toolbar.ql-snow .ql-color-picker .ql-picker-item.ql-selected,
  .ql-toolbar.ql-snow .ql-color-picker .ql-picker-item:hover {
    border-color: ${pageTheme.colors.pri};
  }
 
  .ql-snow .ql-tooltip {
    background-color: ${pageTheme.colors.bg};
    box-shadow: 0px 0px 5px #000;
    color: ${pageTheme.colors.icon};
    padding: 5px 12px;
    white-space: nowrap;
    position: absolute;
    font-size:${(pageTheme.colors.factor * 11)};
  }
  
  .ql-snow .ql-tooltip a.ql-action::after {
    border-right: 1px solid ${pageTheme.colors.nav};
    content: 'Edit';
    margin-left: 16px;
    padding-right: 8px;
  }
  .ql-snow a {
    color: ${pageTheme.colors.accent};
  }
  .ql-container.ql-snow {
    border: 1px solid ${pageTheme.colors.nav};
    background-color:transparent;
  }
  .ql-snow.ql-toolbar button,
    .ql-snow .ql-toolbar button {
      
      height: ${(pageTheme.colors.factor * 32)};
      width: ${(pageTheme.colors.factor * 36)};
    }
  

  .ql-toolbar {
    background-color:${pageTheme.colors.bg};
    border-top: 1px solid ${pageTheme.colors.nav};
    overflow-x: auto;
    width: 100vw;
    white-space: nowrap;
    position: absolute;
    bottom: 0px;
    height: 50px;
    left: 0px;
  }
  
  .ql-editor.ql-blank::before {
    color: ${pageTheme.colors.icon}
  }
  
  #titleInput {
    color:${pageTheme.colors.pri};
    font-size:${32 * 1.5 * pageTheme.colors.factor};

  }

  #textCopy {
    color:${pageTheme.colors.pri};
    font-size:${32 * 1.5 * pageTheme.colors.factor};

  }

  #titleInput::-webkit-input-placeholder {
    color:${pageTheme.colors.icon}
  }

  #titlebar {
    background-color:${pageTheme.colors.shade};
  }

  .ql-picker-options {
    background-color: ${pageTheme.colors.nav};
    border-color:${pageTheme.colors.nav};
  }
  .ql-container {
    font-size:${(pageTheme.colors.factor * 18)};
    color:${pageTheme.colors.pri};
  }

  .info-bar {
    color:${pageTheme.colors.icon};
  }

  svg {
      fill: ${pageTheme.colors.pri} !important;
    }

    .ql-editor ul[data-checked='true'] > li {
      text-decoration-color: ${pageTheme.colors.accent}  ;
    }

    .ql-editor ul[data-checked='true'] > li::before {
      color: ${pageTheme.colors.accent} !important;
   
    }


    
    .ql-editor ul[data-checked='false'] > li::before {
      font-size: 25px;
    
    }  
 
                `
    css.appendChild(document.createTextNode(node));
    document.getElementsByTagName("head")[0].appendChild(css);
}

let proToolbar = [
    [{header: 1}, {header: 2}],
    [{size: ['small', false, 'large', 'huge']}], // custom dropdown
    ['bold', 'italic', 'image'], // toggled buttons
    [{list: 'ordered'}, {list: 'bullet'}, {list: 'check'}],
    [{header: [3, 4, 5, 6]}],
    [{align: []}],
    [{color: []}, {background: []}], // dropdown with defaults from theme
    ['underline', 'strike', 'blockquote', 'code-block'],
    [{script: 'sub'}, {script: 'super'}], // superscript/subscript
    [{indent: '-1'}, {indent: '+1'}], // outdent/indent
    [{direction: 'rtl'}], // text direction
    ['clean'],
];
let simpleToolbar = [
    [{header: 1}, {header: 2}],
    ['bold', 'italic', 'underline', 'strike'], // toggled buttons
    [{align: []}],
    [{direction: 'rtl'}], // text direction

];

let fonts = ['DM Sans', 'sans-serif'];
let fontNames = fonts.map(font => getFontName(font));
function getFontName(font) {
    return font.toLowerCase().replace(/\s/g, '-');
}

function addLinkMatcher() {
    editor.clipboard.addMatcher(Node.TEXT_NODE, function (node, delta) {
        let regex = /https?:\/\/[^\s]+/g;
        if (typeof node.data !== 'string') return;

        let matches = node.data.toLowerCase().match(regex);

        if (matches && matches.length > 0) {
            let ops = [];
            let str = node.data;
            matches.forEach(function (match) {
                let split = str.split(match);
                let beforeLink = split.shift();
                ops.push({insert: beforeLink});
                ops.push({insert: match, attributes: {link: match}});
                str = split.join(match);
            });
            ops.push({insert: str});
            delta.ops = ops;
        }

        return delta;
    });
}

function setFonts() {
    // specify the fonts you would
    let fontStyles = '';
    fonts.forEach(function (font) {
        let fontName = getFontName(font);
        fontStyles +=
            '.ql-snow .ql-picker.ql-font .ql-picker-label[data-value=' +
            fontName +
            ']::before, .ql-snow .ql-picker.ql-font .ql-picker-item[data-value=' +
            fontName +
            ']::before {' +
            "content: '" +
            font +
            "';" +
            "font-family: '" +
            font +
            "';" +
            '}' +
            '.ql-font-' +
            fontName +
            '{' +
            " font-family: '" +
            font +
            "';" +
            '}';
    });
    let node = document.createElement('style');
    node.innerHTML = fontStyles;
    document.body.appendChild(node);
}

function fixDropdownMenuLocations() {
    document.querySelectorAll('.ql-picker').forEach(e => {
        e.addEventListener('mousedown', function (e) {
            e.preventDefault();

        })
    })

    document.querySelectorAll('.ql-picker-label').forEach(e => {
        e.addEventListener('click', function (evt) {

            let top;
            let left;
            let menu;
            let evtItemWidth;
            let evtItemHeight;

            if (!evt.target.offsetParent) {
              
                let _myLocalElement = evt.target.parentElement;
                console.log(_myLocalElement)
                var rect = _myLocalElement.getBoundingClientRect();
                evtItemWidth = _myLocalElement.offsetParent.offsetWidth;
                evtItemHeight = _myLocalElement.offsetParent.offsetHeight;

                top = rect.top;
                left = rect.left;

                menu = _myLocalElement.attributes.getNamedItem('aria-controls').value;
                
            } else {
                //left = evt.target.offsetParent.offsetLeft;
                evtItemWidth = evt.target.offsetParent.offsetWidth;
                evtItemHeight = evt.target.offsetParent.offsetHeight;


                var rect = evt.target.offsetParent.getBoundingClientRect();
                top = rect.top;
                left = rect.left;
                menu = evt.target.attributes.getNamedItem('aria-controls').value;
            }


            let menuHeight = document.getElementById(menu).offsetHeight;
            let menuWidth = document.getElementById(menu).offsetWidth;
            let wDiff;
            if (menuWidth < evtItemWidth) {
                wDiff = evtItemWidth - menuWidth;
                left = left + (wDiff / 2);
            } else {
                wDiff = menuWidth - evtItemWidth;
                left = left - (wDiff / 2);
            }

            console.log('position changing')

            dropDownFixPosition(
                '.ql-picker-label',
                menu,
                top,
                left,
                menuHeight,
                menuWidth
            )

        })
    })


    function dropDownFixPosition(button, dropdown, top, left, height, width) {

        let b = document.querySelector(button);

        var dropDownTop = top - (b.offsetHeight / 2) - height;

        let screenWidth = window.outerWidth;

        if (left + width > screenWidth) {
            left = left - (left + width - screenWidth);
            left -= 10;

        }
        document.getElementById(dropdown).style.top = dropDownTop;
        document.getElementById(dropdown).style.left = left;

        //dropdown.css('top', dropDownTop + 'px');
        //dropdown.css('left', left + 'px');

        window.addEventListener('resize', function () {


            let currentTop = document.querySelector('#toolbar').offsetTop;

            let downTop =
                currentTop - b.offsetHeight - height;


            document.getElementById(dropdown).style.top = downTop + 20;
            document.getElementById(dropdown).style.left = left;


        })
    }
}