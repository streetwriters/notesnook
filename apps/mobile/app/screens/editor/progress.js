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

import React, { useEffect, useRef, useState } from "react";
import { View } from "react-native";
import { ProgressBarComponent } from "../../components/ui/svg/lazy";
import useGlobalSafeAreaInsets from "../../hooks/use-global-safe-area-insets";
import { useAttachmentStore } from "../../stores/use-attachment-store";
import { useThemeStore } from "../../stores/use-theme-store";
import { SIZE } from "../../utils/size";
export const ProgressBar = () => {
  const colors = useThemeStore((state) => state.colors);
  const loading = useAttachmentStore((state) => state.loading);
  const [prog, setProg] = useState(0);
  const [visible, setVisible] = useState(false);
  const timer = useRef();
  const insets = useGlobalSafeAreaInsets();
  const [width, setWidth] = useState(false);

  useEffect(() => {
    if (loading) {
      if (loading.current !== loading.total) {
        setVisible(true);
        setProg(loading.current / loading.total);
      } else {
        clear();
      }
    } else {
      clear();
    }
  }, [loading]);

  const clear = () => {
    clearTimeout(timer.current);
    timer.current = null;
    timer.current = setTimeout(() => {
      setProg(1);
      setTimeout(() => {
        setVisible(false);
      }, 1000);
    }, 100);
  };

  return visible ? (
    <View
      style={{
        justifyContent: "center",
        position: "absolute",
        zIndex: 1,
        marginTop: insets.top + 45,
        width: "100%"
      }}
      onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
    >
      <ProgressBarComponent
        size={SIZE.xxl}
        progress={prog}
        color={colors.accent}
        borderWidth={0}
        height={1}
        width={width || 400}
      />
    </View>
  ) : null;
};
