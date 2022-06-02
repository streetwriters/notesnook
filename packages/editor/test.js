            const text = event.clipboardData.getData("text/plain");
            const vscode = event.clipboardData.getData("vscode-editor-data");
            const vscodeData = vscode ? JSON.parse(vscode) : undefined;
            const language = vscodeData?.mode;

            if (!text || !language) {
            }

            const { tr } = view.state;

            const indent = detectIndentation(text);

            // create an empty code block
            tr.replaceSelectionWith(
            );