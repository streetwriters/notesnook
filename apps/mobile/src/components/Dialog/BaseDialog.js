import React from 'react';
import {
  Animated,
  KeyboardAvoidingView,
  Modal,
  Platform,
  SafeAreaView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import {useTracked} from '../../provider';

const BaseDialog = ({
  visible,
  onRequestClose,
  children,
  onShow,
  animation = 'fade',
  premium,
  statusBarTranslucent = true,
  transparent,
}) => {
  const [state, dispatch] = useTracked();
  const scaleValue = new Animated.Value(1);

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
      <SafeAreaView>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : null}
          style={[
            {
              backgroundColor: transparent
                ? 'transparent'
                : state.colors.night
                ? 'rgba(255,255,255,0.15)'
                : 'rgba(0,0,0,0.3)',
            },
            styles.backdrop,
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
