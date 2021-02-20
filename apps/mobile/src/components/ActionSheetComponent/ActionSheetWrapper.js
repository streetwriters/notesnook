import React from 'react';
import { View } from 'react-native';
import { Platform } from 'react-native';
import ActionSheet from 'react-native-actions-sheet';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTracked } from '../../provider';
import { DDS } from '../../services/DeviceDetection';
import { editing } from '../../utils';
import { hexToRGBA } from '../../utils/ColorUtils';
import { sleep } from '../../utils/TimeUtils';
import {
  EditorWebView,

  textInput
} from '../../views/Editor/Functions';
import tiny from '../../views/Editor/tiny/tiny';
import { focusEditor } from '../../views/Editor/tiny/toolbar/constants';
import { Toast } from '../Toast';
import { GetPremium } from './GetPremium';

const ActionSheetWrapper = ({
  children,
  fwdRef,
  gestureEnabled = true,
  onClose,
  onOpen,
  closeOnTouchBackdrop = true,
}) => {
  const [state] = useTracked();
  const {colors} = state;
  const largeTablet = DDS.isLargeTablet();
  const smallTablet = DDS.isTab;
  const insets = useSafeAreaInsets();
  const style = React.useMemo(() => {
    return {
      width: largeTablet || smallTablet ? 500 : '100%',
      maxHeight: largeTablet ? 500 : '100%',
      borderTopRightRadius: 10,
      borderTopLeftRadius: 10,
      backgroundColor: colors.bg,
      padding: largeTablet ? 8 : 0,
      zIndex: 10,
      paddingVertical: 12,
      borderBottomRightRadius: largeTablet ? 10 : 1,
      borderBottomLeftRadius: largeTablet ? 10 : 1,
      marginBottom: largeTablet ? 50 : 0,
      alignSelf: 'center',
      paddingTop: gestureEnabled ? 8 : 18,
    };
  }, [colors.bg, gestureEnabled]);

  const _onOpen = () => {
    //changeAppScale(0.975, 150);
    onOpen && onOpen();
  };

  const _onClose = async () => {
    //changeAppScale(1, 150);
    if (editing.isFocused === true) {
      textInput.current?.focus();
      await sleep(10);
      if (editing.focusType == 'editor') {
        focusEditor();
      } else {
        Platform.OS === 'android' && EditorWebView.current.requestFocus();
        tiny.call(EditorWebView, tiny.focusTitle);
      }
    }
    if (onClose) {
      onClose();
    }
  };

  return (
    <ActionSheet
      ref={fwdRef}
      hideUnderlay={largeTablet || smallTablet ? true : false}
      containerStyle={style}
      gestureEnabled={gestureEnabled}
      extraScroll={largeTablet ? 50 : 0}
      initialOffsetFromBottom={1}
      closeOnTouchBackdrop={closeOnTouchBackdrop}
      indicatorColor={
        Platform.OS === 'ios'
          ? hexToRGBA(colors.accent + '19')
          : hexToRGBA(colors.shade)
      }
      onOpen={_onOpen}
      keyboardShouldPersistTaps="always"
      premium={
        <>
        <Toast context="local" />
        <GetPremium
          context="sheet"
          close={() => fwdRef?.current?.hide()}
          offset={50}
        />
        </>
      }
      onClose={_onClose}>
      {children}
      <View style={{height:Platform.OS === "ios" ? insets.bottom/2 : 0}}/>
    </ActionSheet>
  );
};

export default ActionSheetWrapper;
