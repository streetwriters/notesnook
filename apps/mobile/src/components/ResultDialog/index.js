import React, {useEffect, useState} from 'react';
import {Text, View} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {useTracked} from '../../provider';
import {DDS} from '../../services/DeviceDetection';
import {eSubscribeEvent, eUnSubscribeEvent} from '../../services/EventManager';
import {getElevation} from '../../utils';
import {eCloseResultDialog, eOpenResultDialog} from '../../utils/Events';
import {ph, SIZE, WEIGHT} from '../../utils/SizeUtils';
import {Button} from '../Button';
import BaseDialog from '../Dialog/base-dialog';
import Seperator from '../Seperator';

const ResultDialog = () => {
  const [state, dispatch] = useTracked();
  const {colors} = state;
  const [visible, setVisible] = useState(false);
  const [dialogData, setDialogData] = useState({
    title: '',
    paragraph: '',
    icon: null,
    button: null,
  });
  useEffect(() => {
    eSubscribeEvent(eOpenResultDialog, open);
    eSubscribeEvent(eCloseResultDialog, close);
    return () => {
      eUnSubscribeEvent(eOpenResultDialog, open);
      eUnSubscribeEvent(eCloseResultDialog, close);
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
          width: DDS.isTab ? 350 : '80%',
          maxHeight: 350,
          borderRadius: 5,
          backgroundColor: colors.bg,
          paddingHorizontal: ph,
          paddingVertical: 20,
          justifyContent: 'center',
          alignItems: 'center',
        }}>
        <Icon name={dialogData.icon} color={colors.accent} size={80} />
        <Text
          style={{
            fontFamily: WEIGHT.bold,
            alignSelf: 'center',
            textAlign: 'center',
            color: colors.heading,
            fontSize: SIZE.lg,
            marginTop: 10,
          }}>
          {dialogData.title}
        </Text>
        <Text
          style={{
            fontFamily: WEIGHT.regular,
            alignSelf: 'center',
            textAlign: 'center',
            color: colors.icon,
            fontSize: SIZE.sm,
          }}>
          {dialogData.paragraph}
        </Text>
        <Seperator />
        <Button title={dialogData.button} width="100%" onPress={close} />
      </View>
    </BaseDialog>
  );
};

export default ResultDialog;
