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

import changeAppTheme from "./changeAppTheme";
import checkForUpdate from "./checkForUpdate";
import downloadUpdate from "./downloadUpdate";
import installUpdate from "./installUpdate";
import open from "./open";
import saveFile from "./saveFile";
import setZoomFactor from "./setZoomFactor";
import setPrivacyMode from "./setPrivacyMode";
import showNotification from "./showNotification";
import bringToFront from "./bringToFront";
import setSpellCheckerLanguages from "./setSpellCheckerLanguages";
import toggleSpellChecker from "./toggleSpellChecker";

const actions = {
  changeAppTheme,
  checkForUpdate,
  downloadUpdate,
  installUpdate,
  open,
  saveFile,
  setZoomFactor,
  setPrivacyMode,
  showNotification,
  bringToFront,
  setSpellCheckerLanguages,
  toggleSpellChecker
};

export function getAction(actionName) {
  try {
    if (!actions[actionName]) throw new Error("Invalid action name.");
  } catch (e) {
    console.error(e);
  }
  return actions[actionName];
}
