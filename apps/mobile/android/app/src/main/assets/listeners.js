
function attachTitleInputListeners() {
    document.getElementById('formBox').onsubmit = function (evt) {
        evt.preventDefault()
        editor.focus();
        editor.setSelection(editor.getText().length - 1, 0);
        onTitleChange();
    }

    document.getElementById('titleInput').onkeydown = function (evt) {
        onTitleChange();
    }

    document.getElementById('titleInput').onkeyup = function (evt) {

        onTitleChange()
    }



}

function onTitleChange() {
    let titleMessage = {
        type: 'title',
        value: document.getElementById('titleInput').value
    }

    if (titleMessage && typeof titleMessage.value === 'string') {
        window.ReactNativeWebView.postMessage(JSON.stringify(titleMessage));
    }
}

function attachEditorListeners() {


    editor.once('text-change', function () {

        window.ReactNativeWebView.postMessage("loaded");
        let text = editor.getText();
        document.getElementById("infowords").innerText = text.split(' ').length + ' words';

    });

    document.addEventListener('message', data => {

        let message = JSON.parse(data.data);
        let type = message.type;
        let value;
        if (message.value && message.type !== 'nomenu') {
            value = message.value;
        } else {
            value = message.value
        }
        switch (type) {
            case "reset": {
                editor.history.clear();
                editor.setText('', 'api');
                document.getElementById('titleInput').value = '';
                document.getElementById('titleInput').blur();
                editor.blur();
                document.getElementById('titleInput').blur();
                window.blur();
                document.getElementById('infodate').innerText = "";
                document.getElementById('infosaved').innerText = "";
                document.getElementById("infowords").innerText = "";
                break
            }
            case "blur":
                document.getElementById('titleInput').blur();
                editor.blur();
                window.blur();
                break;
            case "undo":
                editor.history.undo();
                break;
            case "redo":
                editor.history.redo();
                break;
            case "clearHistory":
                editor.history.clear();
                break;
            case "dateEdited":
                document.getElementById('infodate').innerText = value;
                break;
            case "saving":
                document.getElementById('infosaved').innerText = value;
                break;
            case "text":
                editor.setText(value, 'api')
                setTimeout(() => {
                    if (message.focus === "editor") {
                        //editor.focus();
                    } else {
                        //document.getElementById('titleInput').focus();
                    }
                }, 0)
                break;
            case "clearEditor":
                editor.setText('', 'api');
                break;
            case "clearTitle":
                document.getElementById('titleInput').value = '';
                break;
            case "focusEditor":
                editor.focus();
                break;
            case "focusTitle":
                document.getElementById('titleInput').focus();
                break;
            case "nomenu":
                let isenabled = value;
                //let width = window.innerWidth;
                let titleIn = document.getElementById('titlebar');
                if (isenabled) {
                    //titleIn.style.width = width;
                    titleIn.style['padding-left'] = 12;
                    titleIn.style['padding-right'] = window.innerWidth * 0.40;
                } else {
                    //titleIn.style.width = width - 120;
                    titleIn.style['padding-left'] = 60;
                    titleIn.style['padding-right'] = window.innerWidth * 0.40;
                }
                break;
            case "title":
                document.getElementById('titleInput').value = JSON.parse(data.data).value
                break;
            case "theme":
                pageTheme.colors = value;
                setTheme();
                break;

            case "delta":
                const content = value
                editor.setContents(content, 'api');
                /* setTimeout(() => {
                  editor.setSelection(editor.getText().length - 1, 0);
                }, 500) */

                break;
            case "html":
                editor.setContents(
                    editor.clipboard.convert(value, 'api'),
                    'silent'
                );
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

    editor.on("selection-change", function(evt) {
        console.log(evt);
        if (evt.length > 0) return;
        var bounds = editor.getBounds(evt.index, evt.index);
        console.log(bounds)
        setTimeout(() => {
            document.querySelector(".app-main").scrollTo({top:bounds.top,behavior:"smooth"})
        },250)
    
    });
    


    editor.on('text-change', function (delta, oldDelta, source) {
        var regex = /https?:\/\/[^\s]+$/;
        if (source === "api") return;
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


        let m = {};
        m.delta = {ops: editor.getContents().ops}

        m.text = editor.getText();
        document.getElementById("infowords").innerText = m.text.split(' ').length + ' words';
        m.html = editor.root.innerHTML;
        m.type = 'content';
        window.ReactNativeWebView.postMessage(JSON.stringify(m));

    });
}