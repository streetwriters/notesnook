import React, { useEffect, useRef, useState } from "react";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ProgressBarComponent } from "../../components/ui/svg/lazy";
import { useAttachmentStore } from "../../stores/use-attachment-store";
import { useThemeStore } from "../../stores/use-theme-store";
import { SIZE } from "../../utils/size";
export const ProgressBar = () => {
  const colors = useThemeStore((state) => state.colors);
  const loading = useAttachmentStore((state) => state.loading);
  const [prog, setProg] = useState(0);
  const [visible, setVisible] = useState(false);
  const timer = useRef();
  const insets = useSafeAreaInsets();
  const [width, setWidth] = useState(false);

  useEffect(() => {
    if (loading) {
      console.log(loading);
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
