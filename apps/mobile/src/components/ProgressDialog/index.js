import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useTracked } from '../../provider';
import { eSubscribeEvent, eUnSubscribeEvent } from '../../services/EventManager';
import { eCloseProgressDialog, eOpenProgressDialog } from '../../utils/Events';
import BaseDialog from '../Dialog/base-dialog';
import DialogContainer from '../Dialog/dialog-container';
import Heading from '../Typography/Heading';
import Paragraph from '../Typography/Paragraph';

const ProgressDialog = () => {
  const [state, ] = useTracked();
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
    <BaseDialog visible={true}>
      <DialogContainer>
        <View
          style={{
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: 10,
          }}>
          <Heading>   {dialogData.title}</Heading>
          <Paragraph style={{textAlign: 'center'}}>
         
            <Paragraph color={colors.errorText}>
              {' '}
              Do not close the app.
            </Paragraph>
          </Paragraph>
        </View>
        <ActivityIndicator color={colors.accent} />
      </DialogContainer>
    </BaseDialog>
  );
};

export default ProgressDialog;
