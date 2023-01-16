/*
This file is part of the Notesnook project (https://notesnook.com/)

Copyright (C) 2023 Streetwriters (Private) Limited

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

import { Menu, MenuItem, clipboard } from "electron";

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
export { setupMenu };
