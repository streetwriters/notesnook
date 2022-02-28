import React, { useEffect } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  SafeAreaView,
  StyleSheet,
  TouchableOpacity,
  View
} from 'react-native';
import { useSettingStore } from '../../stores/stores';
import useIsFloatingKeyboard from '../../utils/hooks/use-is-floating-keyboard';
import { BouncingView } from '../ui/transitions/bouncing-view';

const BaseDialog = ({
  visible,
  onRequestClose,
  children,
  onShow,
  animation = 'fade',
  premium,
  statusBarTranslucent = true,
  transparent,
  centered = true,
  bottom = false,
  background = null,
  animated = true,
  bounce = true,
  closeOnTouch = true,
  useSafeArea = true
}) => {
  const floating = useIsFloatingKeyboard();

  useEffect(() => {
    return () => {
      useSettingStore.getState().setSheetKeyboardHandler(true);
    };
  }, []);

  const Wrapper = useSafeArea ? SafeAreaView : View;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animated
      statusBarTranslucent={statusBarTranslucent}
      supportedOrientations={[
        'portrait',
        'portrait-upside-down',
        'landscape',
        'landscape-left',
        'landscape-right'
      ]}
      onShow={() => {
        if (onShow) {
          onShow();
          useSettingStore.getState().setSheetKeyboardHandler(false);
        }
      }}
      animationType={animation}
      onRequestClose={() => {
        if (!closeOnTouch) return null;
        useSettingStore.getState().setSheetKeyboardHandler(true);
        onRequestClose && onRequestClose();
      }}
    >
      <Wrapper
        style={{
          backgroundColor: background ? background : transparent ? 'transparent' : 'rgba(0,0,0,0.3)'
        }}
      >
        <KeyboardAvoidingView enabled={!floating && Platform.OS === 'ios'} behavior="padding">
          <BouncingView
            duration={400}
            animated={animated}
            initialScale={bounce ? 0.9 : 1}
            style={[
              styles.backdrop,
              {
                justifyContent: centered ? 'center' : bottom ? 'flex-end' : 'flex-start'
              }
            ]}
          >
            <TouchableOpacity
              onPress={closeOnTouch ? onRequestClose : null}
              style={styles.overlayButton}
            />
            {premium}
            {children}
          </BouncingView>
        </KeyboardAvoidingView>
      </Wrapper>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center'
  },
  overlayButton: {
    width: '100%',
    height: '100%',
    position: 'absolute'
  }
});

export default BaseDialog;
