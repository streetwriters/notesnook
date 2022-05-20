import React, { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import * as Progress from 'react-native-progress';
import { useThemeStore } from '../../stores/use-theme-store';
import { useAttachmentStore } from '../../stores/use-attachment-store';
import { SIZE } from '../../utils/size';

export const ProgressCircle = () => {
  const colors = useThemeStore(state => state.colors);

  const loading = useAttachmentStore(state => state.loading);
  const [prog, setProg] = useState(0);
  const [visible, setVisible] = useState(false);
  const timer = useRef();

  const formatText = progress => {
    progress = (progress * 100).toFixed(0);
    if (progress === 0) {
      progress = 10;
    }
    return progress + '%';
  };

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
        justifyContent: 'center',
        marginLeft: 10
      }}
    >
      <Progress.Circle
        size={SIZE.xxl}
        progress={prog}
        showsText
        textStyle={{
          fontSize: 7
        }}
        color={colors.accent}
        formatText={formatText}
        borderWidth={0}
        thickness={2}
      />
    </View>
  ) : null;
};
