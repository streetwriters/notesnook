import React, {useEffect, useState} from 'react';
import {ActivityIndicator, View} from 'react-native';
import {useTracked} from '../../provider';
import {eSubscribeEvent, eUnSubscribeEvent} from '../../services/EventManager';
import {eCloseProgressDialog, eOpenProgressDialog} from '../../utils/Events';
import {Button} from '../Button';
import BaseDialog from '../Dialog/base-dialog';
import DialogContainer from '../Dialog/dialog-container';
import Heading from '../Typography/Heading';
import Paragraph from '../Typography/Paragraph';

const ProgressDialog = () => {
  const [state] = useTracked();
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
    <BaseDialog
      visible={true}
      onRequestClose={() => {
        if (dialogData.noProgress) {
          setVisible(false);
          setDialogData(null);
        }
      }}>
      <DialogContainer>
        <View
          style={{
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: 10,
          }}>
          <Heading> {dialogData?.title}</Heading>
          <Paragraph style={{textAlign: 'center'}}>
            {dialogData?.paragraph}
            {!dialogData?.noProgress ? (
              <Paragraph color={colors.errorText}>
                {' '}
                Do not close the app.
              </Paragraph>
            ) : null}
          </Paragraph>
        </View>
        {!dialogData?.noProgress ? (
          <ActivityIndicator color={colors.accent} />
        ) : null}
        {dialogData?.action ? (
          <Button type="transparent" title={dialogData.actionText} />
        ) : null}
      </DialogContainer>
    </BaseDialog>
  );
};

export default ProgressDialog;
