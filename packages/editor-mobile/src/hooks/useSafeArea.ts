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

import { useState } from "react";
import { SafeAreaType } from "../utils";

const insetsStorage = localStorage.getItem("safeAreaInsets");
const initialState =
  insetsStorage && !globalThis.noHeader
    ? JSON.parse(insetsStorage)
    : {
        top: 0,
        bottom: 0,
        left: 0,
        right: 0
      };

global.safeAreaController = {
  update: (safeArea) => {
    if (safeAreaController.set) safeAreaController.set(safeArea);
    safeAreaController.previous = safeArea;
    localStorage.setItem("safeAreaInsets", JSON.stringify(safeArea));
  },
  reset: () => {
    if (safeAreaController.set) safeAreaController.set(initialState);
  },
  previous: initialState
};

export const useSafeArea = (): SafeAreaType => {
  const [safeArea, setSafeArea] = useState(global.safeAreaController.previous);
  global.safeAreaController.set = setSafeArea;

  return safeArea;
};
