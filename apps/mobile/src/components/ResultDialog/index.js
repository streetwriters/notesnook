import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { useTracked } from '../../provider';
import { DDS } from '../../services/DeviceDetection';
import { eSubscribeEvent, eUnSubscribeEvent } from '../../services/EventManager';
import { getElevation } from '../../utils';
import { eCloseResultDialog, eOpenResultDialog } from '../../utils/Events';
import { ph, SIZE } from '../../utils/SizeUtils';
import { Button } from '../Button';
import BaseDialog from '../Dialog/base-dialog';
import Seperator from '../Seperator';
import Heading from '../Typography/Heading';
import Paragraph from '../Typography/Paragraph';
import { ProFeatures } from './pro-features';

const ResultDialog = () => {
  const [state, dispatch] = useTracked();
  const {colors} = state;
  const [visible, setVisible] = useState(false);
  const [dialogData, setDialogData] = useState({
    title: 'Thank you for signing up!',
    paragraph:
      'Try out all features of Notesnook free for 7 days. No limitations. No commitments.',
    button: 'Start taking notes'
  });
  useEffect(() => {
    eSubscribeEvent(eOpenResultDialog, open);
    eSubscribeEvent(eCloseResultDialog, close);
    return () => {
      eUnSubscribeEvent(eOpenResultDialog, open);
      eUnSubscribeEvent(eCloseResultDialog, close);
    };
  }, []);

  const open = data => {
    if (data) {
      setDialogData(data);
    } 
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
          width: DDS.isTab ? 350 : '85%',
          maxHeight: 500,
          borderRadius: 10,
          backgroundColor: colors.bg,
          paddingHorizontal: ph,
          paddingVertical: 20,
          justifyContent: 'center',
          alignItems: 'center'
        }}>
        <Heading
          size={SIZE.lg}
          textBreakStrategy="balanced"
          style={{
            alignSelf: 'center',
            textAlign: 'center',
            marginTop: 10,
            maxWidth: '80%',
            marginBottom: 10
          }}>
          {dialogData.title}
        </Heading>

        <Paragraph
          color={colors.icon}
          size={SIZE.md}
          style={{
            alignSelf: 'center',
            textAlign: 'center',
            maxWidth: '80%',
            lineHeight: SIZE.sm + 5
          }}>
          {dialogData.paragraph}
        </Paragraph>

        <Seperator />

        <ProFeatures />

        <Seperator />
        <Button
          title={dialogData.button}
          width="100%"
          onPress={close}
          type="accent"
          height={50}
          fontSize={SIZE.md}
        />
      </View>
    </BaseDialog>
  );
};

export default ResultDialog;
