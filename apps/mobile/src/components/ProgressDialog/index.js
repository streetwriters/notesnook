import React, {useEffect, useState} from 'react';
import {Text, View} from 'react-native';
import {useTracked} from '../../provider';
import {eSubscribeEvent, eUnSubscribeEvent} from '../../services/EventManager';
import {eOpenProgressDialog, eCloseProgressDialog} from '../../utils/Events';
import {getElevation} from '../../utils';
import BaseDialog from '../Dialog/base-dialog';
import {Loading} from '../Loading';
import {ph, SIZE, WEIGHT} from '../../utils/SizeUtils';
import {DDS} from '../../services/DeviceDetection';
import Paragraph from '../Typography/Paragraph';

const ProgressDialog = () => {
  const [state, dispatch] = useTracked();
  const {colors} = state;
  const [visible, setVisible] = useState(false);
  const [dialogData, setDialogData] = useState({
    title: 'Loading',
    paragraph: 'Loading tagline',
  });
  useEffect(() => {
    eSubscribeEvent(eOpenProgressDialog, open);
    eSubscribeEvent(eCloseProgressDialog, close);
    return () => {
      eUnSubscribeEvent(eOpenProgressDialog, open);
      eUnSubscribeEvent(eCloseProgressDialog, close);
    };
  }, []);

  const open = (data) => {
    setDialogData(data);
    setVisible(true);
  };

  const close = () => {
    setVisible(false);
  };

  return !visible ? null : (
    <BaseDialog visible={true} onRequestClose={close}>
      <View
        style={{
          ...getElevation(5),
          width: DDS.isTab ? 350 : '80%',
          maxHeight: 350,
          borderRadius: 5,
          backgroundColor: colors.bg,
          paddingHorizontal: ph,
          paddingVertical: 20,
        }}>
        <Loading height={40} tagline={dialogData.title} />
        <Paragraph
          color={colors.icon}
          style={{
            alignSelf: 'center',
            textAlign: 'center',
          }}>
          {dialogData.paragraph}
        </Paragraph>
      </View>
    </BaseDialog>
  );
};

export default ProgressDialog;
