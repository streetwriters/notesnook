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
import { Keyboard, KeyboardEvent, useWindowDimensions } from "react-native";
import { useCallback } from "react";

/**
 * A hook that detects floating keyboard on iPad
 * @returns Is keyboard floating or not
 */
const useIsFloatingKeyboard = () => {
  const { width } = useWindowDimensions();

  const [floating, setFloating] = useState<boolean>(false);
  const onKeyboardWillChangeFrame = useCallback(
    (event: KeyboardEvent) => {
      setFloating(event.endCoordinates.width < width);
    },
    [width]
  );

  useEffect(() => {
    const sub1 = Keyboard.addListener(
      "keyboardWillChangeFrame",
      onKeyboardWillChangeFrame
    );
    return () => {
      sub1?.remove();
    };
  }, [onKeyboardWillChangeFrame, width]);

  return floating;
};

export default useIsFloatingKeyboard;
