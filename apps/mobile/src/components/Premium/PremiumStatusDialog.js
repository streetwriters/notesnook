import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTracked } from '../../provider';
import { getElevation } from '../../utils';
import { ph, pv, SIZE } from '../../utils/SizeUtils';
import BaseDialog from '../Dialog/base-dialog';
import DialogContainer from '../Dialog/dialog-container';
import Seperator from '../Seperator';
import Heading from '../Typography/Heading';
import Paragraph from '../Typography/Paragraph';

const {
  eSubscribeEvent,
  eUnSubscribeEvent,
} = require('../../services/EventManager');
const {
  eOpenPremiumStatusDialog,
  eClosePremiumStatusDialog,
} = require('../../utils/Events');

const PremiumStatusDialog = () => {
  const [state] = useTracked();
  const {colors} = state;
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    eSubscribeEvent(eOpenPremiumStatusDialog, open);
    eSubscribeEvent(eClosePremiumStatusDialog, close);

    return () => {
      eUnSubscribeEvent(eOpenPremiumStatusDialog, open);
      eUnSubscribeEvent(eClosePremiumStatusDialog, close);
    };
  }, []);

  const open = () => {
    setVisible(true);
  };

  const close = () => {
    setVisible(false);
  };

  return (
    visible && (
      <BaseDialog visible={true} onRequestClose={close}>
        <DialogContainer>
          <View
            style={[
              {
                justifyContent: 'center',
                alignItems: 'center',
              },
            ]}>
            <View style={styles.headingContainer}>
              <Heading color={colors.accent} style={styles.heading}>
                Notesnook Pro
              </Heading>
            </View>
            <Seperator />
            <Paragraph
              style={{
                textAlign: 'center',
                width: '90%',
                alignSelf: 'center',
              }}>
              Your account has been upgraded to Notesnook Pro successfully. Now
              you can enjoy all premium features!
            </Paragraph>
            <Seperator />
          </View>
        </DialogContainer>
      </BaseDialog>
    )
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
    fontFamily: "sans-serif",
    fontWeight:'bold',
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
    fontFamily: "sans-serif",
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
