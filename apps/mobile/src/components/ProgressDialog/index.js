import React, {useEffect, useState} from 'react';
import {Text, View} from 'react-native';
import {ph, SIZE, WEIGHT} from '../../common/common';
import {useTracked} from '../../provider';
import {eSubscribeEvent, eUnSubscribeEvent} from '../../services/eventManager';
import {eOpenProgressDialog, eCloseProgressDialog} from '../../services/events';
import {DDS, getElevation} from '../../utils/utils';
import BaseDialog from '../Dialog/base-dialog';
import {Loading} from '../Loading';

const ProgressDialog = () => {
  const [state, dispatch] = useTracked();
  const {colors, tags, premiumUser} = state;
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

  return (
    <BaseDialog visible={visible} onRequestClose={close}>
      <View
        style={{
          ...getElevation(5),
          width: DDS.isTab? 350 : '80%',
          maxHeight: 350,
          borderRadius: 5,
          backgroundColor: colors.bg,
          paddingHorizontal: ph,
          paddingVertical: 20,
        }}>
        <Loading height={40} tagline={dialogData.title} />
        <Text
          style={{
            fontFamily: WEIGHT.regular,
            alignSelf: 'center',
            textAlign: 'center',
            color: colors.icon,
            fontSize: SIZE.xs,
          }}>
          {dialogData.paragraph}
        </Text>
      </View>
    </BaseDialog>
  );
};

export default ProgressDialog;
