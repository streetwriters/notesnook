const { Menu, MenuItem, clipboard } = require("electron");

/**
 *
 * @param {import("@playwright/test").BrowserWindow} mainWindow
 */
function setupMenu(mainWindow) {
  mainWindow.webContents.on("context-menu", (event, params) => {
    const menu = new Menu();
    if (params.isEditable) {
      menu.append(
        new MenuItem({
          label: "Undo",
          role: "undo",
          enabled: params.isEditable,
          accelerator: "CommandOrControl+Z"
        })
      );

      menu.append(
        new MenuItem({
          label: "Redo",
          role: "redo",
          enabled: params.isEditable,
          accelerator: "CommandOrControl+Y"
        })
      );

      menu.append(
        new MenuItem({
          type: "separator"
        })
      );
    }

    if (params.isEditable)
      menu.append(
        new MenuItem({
          label: "Cut",
          role: "cut",
          enabled: params.selectionText.length > 0,
          accelerator: "CommandOrControl+X"
        })
      );

    menu.append(
      new MenuItem({
        label: "Copy",
        role: "copy",
        enabled: params.selectionText.length > 0,
        accelerator: "CommandOrControl+C"
      })
    );

    if (params.isEditable)
      menu.append(
        new MenuItem({
          label: "Paste",
          role: "pasteAndMatchStyle",
          enabled: clipboard.readText("clipboard").length > 0,
          accelerator: "CommandOrControl+V"
        })
      );

    // Add each spelling suggestion
    // for (const suggestion of params.dictionarySuggestions) {
    //   menu.append(
    //     new MenuItem({
    //       label: suggestion,
    //       click: () => mainWindow.webContents.replaceMisspelling(suggestion),
    //     })
    //   );
    // }

    // Allow users to add the misspelled word to the dictionary
    // if (params.misspelledWord) {
    //   menu.append(
    //     new MenuItem({
    //       label: "Add to dictionary",
    //       click: () =>
    //         mainWindow.webContents.session.addWordToSpellCheckerDictionary(
    //           params.misspelledWord
    //         ),
    //     })
    //   );
    // }
    menu.popup();
  });
}
module.exports = { setupMenu };
