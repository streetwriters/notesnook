import React from 'react';
import { Platform, View } from 'react-native';
import ActionSheet from 'react-native-actions-sheet';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTracked } from '../../provider';
import { useSettingStore } from '../../provider/stores';
import { editing } from '../../utils';
import { hexToRGBA } from '../../utils/ColorUtils';
import { sleep } from '../../utils/TimeUtils';
import { EditorWebView, textInput } from '../../views/Editor/Functions';
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
  onHasReachedTop
}) => {
  const [state] = useTracked();
  const {colors} = state;
  const deviceMode = useSettingStore(state => state.deviceMode);
  const largeTablet = deviceMode === "tablet"
  const smallTablet = deviceMode === "smallTablet"
  
  const insets = useSafeAreaInsets();
  const style = React.useMemo(() => {
    return {
      width: largeTablet || smallTablet ? 500 : '100%',
      backgroundColor: colors.bg,
      zIndex: 10,
      paddingTop:10,
      paddingBottom:0,
      borderBottomRightRadius: largeTablet ? 10 : 1,
      borderBottomLeftRadius: largeTablet ? 10 : 1,
      borderTopRightRadius: 10,
      borderTopLeftRadius: 10,
      marginBottom: largeTablet ? 50 : 0,
      alignSelf: 'center',
    };
  }, [colors.bg, gestureEnabled]);

  const _onOpen = () => {
    onOpen && onOpen();
  };

  const _onClose = async () => {
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
      drawUnderStatusBar={false}
      containerStyle={style}
      gestureEnabled={gestureEnabled}
      extraScroll={largeTablet ? 50 : 0}
      initialOffsetFromBottom={1}
      onPositionChanged={onHasReachedTop}
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
      <View style={{height: Platform.OS === 'ios' ? insets.bottom / 2 :0}} />
    </ActionSheet>
  );
};

export default ActionSheetWrapper;
