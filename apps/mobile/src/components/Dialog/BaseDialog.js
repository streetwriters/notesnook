import React from 'react';
import {
  Animated,
  Modal,
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
}) => {
  const [state, dispatch] = useTracked();
  const scaleValue = new Animated.Value(1);

  return (
    <Modal
      visible={visible}
      transparent={true}
      animated
      statusBarTranslucent
      onShow={() => {
        if (onShow) {
          onShow();
        }
      }}
      animationType={animation}
      onRequestClose={onRequestClose}>
      <View
        style={[
          {
            backgroundColor: state.colors.night
              ? 'rgba(255,255,255,0.15)'
              : 'rgba(0,0,0,0.3)',
          },
          styles.backdrop,
        ]}>
        <TouchableOpacity
          onPress={onRequestClose}
          style={styles.overlayButton}
        />

        {children}
      </View>
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
