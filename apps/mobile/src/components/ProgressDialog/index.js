import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { useTracked } from '../../provider';
import { DDS } from '../../services/DeviceDetection';
import { eSubscribeEvent, eUnSubscribeEvent } from '../../services/EventManager';
import { getElevation } from '../../utils';
import { eCloseProgressDialog, eOpenProgressDialog } from '../../utils/Events';
import { ph } from '../../utils/SizeUtils';
import BaseDialog from '../Dialog/base-dialog';
import { Loading } from '../Loading';
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
