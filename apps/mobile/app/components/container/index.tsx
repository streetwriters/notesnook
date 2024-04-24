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

import React, { PropsWithChildren, useEffect, useRef, useState } from "react";
import { Dimensions, Platform, View, useWindowDimensions } from "react-native";
import useGlobalSafeAreaInsets from "../../hooks/use-global-safe-area-insets";
import useKeyboard from "../../hooks/use-keyboard";
import { useThemeColors } from "@notesnook/theme";

export const Container = ({ children }: PropsWithChildren) => {
  const { colors } = useThemeColors();
  const insets = useGlobalSafeAreaInsets();
  const keyboard = useKeyboard();
  const [height, setHeight] = useState(0);
  const windowHeightRef = useRef(Dimensions.get("window").height);
  const { height: windowHeight } = useWindowDimensions();
  const timerRef = useRef<NodeJS.Timeout>();
  useEffect(() => {
    if (windowHeight !== windowHeightRef.current) {
      setHeight(0);
      windowHeightRef.current = windowHeight;
    }
  }, [windowHeight]);

  return (
    <View
      style={{
        overflow: "hidden",
        paddingTop: Platform.OS === "android" ? 0 : insets.top,
        paddingBottom: Platform.OS === "android" ? 0 : insets.bottom,
        height: height || "100%",
        width: "100%",
        backgroundColor: colors.primary.background
      }}
      onLayout={(event) => {
        const height = event.nativeEvent.layout.height;
        clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => {
          if (!keyboard.keyboardShown) {
            setHeight(height);
          }
        }, 500);
      }}
    >
      {children}
    </View>
  );
};

export default Container;
