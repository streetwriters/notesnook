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

import { useEffect, useState } from "react";
import { AppState, AppStateStatus } from "react-native";

export function useAppState() {
  const currentState = AppState.currentState;
  const [appState, setAppState] = useState(currentState);

  useEffect(() => {
    function onChange(newState: AppStateStatus) {
      setAppState(newState);
    }

    const subscription = AppState.addEventListener("change", onChange);

    return () => {
      // @ts-expect-error - React Native >= 0.65
      if (typeof subscription?.remove === "function") {
        // @ts-expect-error - need update @types/react-native@0.65.x
        subscription.remove();
      } else {
        // React Native < 0.65
        AppState.removeEventListener("change", onChange);
      }
    };
  }, []);

  return appState;
}

export { AppStateStatus };
