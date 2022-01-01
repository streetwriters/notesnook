import React, {useEffect} from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  SafeAreaView,
  StyleSheet,
  TouchableOpacity
} from 'react-native';
import {useSettingStore} from '../../provider/stores';
import useIsFloatingKeyboard from '../../utils/use-is-floating-keyboard';
import {BouncingView} from '../Transitions/bouncing-view';

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
  bounce,
  closeOnTouch = true
}) => {
  const floating = useIsFloatingKeyboard();

  useEffect(() => {
    return () => {
      useSettingStore.getState().setSheetKeyboardHandler(true);
    };
  }, []);

  return (
    <Modal
      visible={visible}
      transparent={true}
      animated
      statusBarTranslucent={statusBarTranslucent}
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
      }}>
      <SafeAreaView
        style={{
          backgroundColor: background
            ? background
            : transparent
            ? 'transparent'
            : 'rgba(0,0,0,0.3)'
        }}>
        <KeyboardAvoidingView
          enabled={!floating && Platform.OS === 'ios'}
          behavior="padding">
          <BouncingView
            duration={400}
            animated={animated}
            initialScale={bounce ? 0.9 : 1}
            style={[
              styles.backdrop,
              {
                justifyContent: centered
                  ? 'center'
                  : bottom
                  ? 'flex-end'
                  : 'flex-start'
              }
            ]}>
            <TouchableOpacity
              onPress={closeOnTouch ? onRequestClose : null}
              style={styles.overlayButton}
            />
            {premium}
            {children}
          </BouncingView>
        </KeyboardAvoidingView>
      </SafeAreaView>
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
