import React, {useEffect, useState} from 'react';
import {Modal, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {useTracked} from '../../provider';
import {getElevation} from '../../utils';
import Seperator from '../Seperator';
import {ph, pv, SIZE, WEIGHT} from "../../utils/SizeUtils";
import {DDS} from "../../services/DeviceDetection";

const {
  eSubscribeEvent,
  eUnSubscribeEvent,
} = require('../../services/EventManager');
const {
  eOpenPremiumStatusDialog,
  eClosePremiumStatusDialog,
} = require('../../utils/Events');

const PremiumStatusDialog = () => {
  const [state, dispatch] = useTracked();
  const {colors, premiumUser} = state;
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    eSubscribeEvent(eOpenPremiumStatusDialog, open);
    eSubscribeEvent(eClosePremiumStatusDialog, close);

    return () => {
      eUnSubscribeEvent(eOpenPremiumStatusDialog, open);
      eUnSubscribeEvent(eClosePremiumStatusDialog, close);
    };
  }, []);

  const open = (data) => {
    setVisible(true);
  };

  const close = (data) => {
    setVisible(false);
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animated
      animationType="fade"
      onRequestClose={close}>
      <View style={styles.wrapper}>
        <TouchableOpacity onPress={close} style={styles.overlay} />
        <View
          style={[
            {
              width: DDS.isTab ? '40%' : '80%',
              backgroundColor: colors.bg,
            },
            styles.container,
          ]}>
          <View style={styles.headingContainer}>
            <Text style={[{color: colors.accent}, styles.heading]}>
              Notesnook Pro
            </Text>
          </View>
          <Seperator />
          <Text
            style={{
              color: colors.pri,
              fontFamily: WEIGHT.regular,
              fontSize: SIZE.sm,
              textAlign: 'center',
              width: '90%',
              alignSelf: 'center',
            }}>
            Your account has been upgraded to Notesnook Pro successfully. Now
            you can enjoy all premium features!
          </Text>
          <Seperator />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    ...getElevation(5),
    maxHeight: 350,
    borderRadius: 5,
    paddingHorizontal: ph,
    paddingVertical: pv,
  },
  headingContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonContainer: {
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heading: {
    fontFamily: WEIGHT.bold,
    marginLeft: 5,
    fontSize: SIZE.xxxl,
  },
  button: {
    paddingVertical: pv,
    paddingHorizontal: ph,
    marginTop: 10,
    borderRadius: 5,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    flexDirection: 'row',
  },
  buttonText: {
    fontFamily: WEIGHT.medium,
    color: 'white',
    fontSize: SIZE.sm,
    marginLeft: 5,
  },
  overlay: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
});

export default PremiumStatusDialog;
