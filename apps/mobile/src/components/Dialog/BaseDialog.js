import React from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  SafeAreaView,
  StyleSheet,
  TouchableOpacity
} from 'react-native';
import { useTracked } from '../../provider';
import useIsFloatingKeyboard from '../../utils/use-is-floating-keyboard';

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
  background = null
}) => {
  const [state, dispatch] = useTracked();
  const floating = useIsFloatingKeyboard();
  
  return (
    <Modal
      visible={visible}
      transparent={true}
      animated
      statusBarTranslucent={statusBarTranslucent}
      onShow={() => {
        if (onShow) {
          onShow();
        }
      }}
      animationType={animation}
      onRequestClose={onRequestClose}>
      <SafeAreaView
        style={{
          backgroundColor:background? background : transparent
            ? 'transparent'
            : 'rgba(0,0,0,0.3)',
        }}>
        <KeyboardAvoidingView
          enabled={!floating && Platform.OS === 'ios'}
          behavior="padding"
          style={[
            styles.backdrop,
            {
              justifyContent: centered ? 'center' : bottom ? 'flex-end' : 'flex-start',
            },
          ]}>
          <TouchableOpacity
            onPress={onRequestClose}
            style={styles.overlayButton}
          />
          {premium}

          {children}
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
    alignItems: 'center',
  },
  overlayButton: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
});

export default BaseDialog;
