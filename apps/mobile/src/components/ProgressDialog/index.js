import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useTracked } from '../../provider';
import { eSubscribeEvent, eUnSubscribeEvent } from '../../services/EventManager';
import { eCloseProgressDialog, eOpenProgressDialog } from '../../utils/Events';
import { SIZE } from '../../utils/SizeUtils';
import { sleep } from '../../utils/TimeUtils';
import ActionSheetWrapper from '../ActionSheetComponent/ActionSheetWrapper';
import { Button } from '../Button';
import { Toast } from '../Toast';
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
  const actionSheetRef = useRef();
  useEffect(() => {
    eSubscribeEvent(eOpenProgressDialog, open);
    eSubscribeEvent(eCloseProgressDialog, close);
    return () => {
      eUnSubscribeEvent(eOpenProgressDialog, open);
      eUnSubscribeEvent(eCloseProgressDialog, close);
    };
  }, []);

  const open = async (data) => {
    setDialogData(data);
    setVisible(true);
    await sleep(1);
    actionSheetRef.current?._setModalVisible(true);
  };

  const close = () => {
    setVisible(false);
  };

  return !visible ? null : (
    <ActionSheetWrapper
      fwdRef={actionSheetRef}
      gestureEnabled={dialogData?.noProgress}
      onClose={() => {
        if (dialogData.noProgress) {
          setVisible(false);
          setDialogData(null);
        }
      }}>
      <View
        style={{
          justifyContent: 'center',
          alignItems: 'center',
          marginBottom: 10,
          paddingHorizontal: 12,
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
        <ActivityIndicator size={SIZE.xxxl} color={colors.accent} />
      ) : null}

      {dialogData?.action ? (
        <Button
          type="transparent"
          onPress={dialogData.action}
          title={dialogData.actionText}
        />
      ) : null}

      <Toast context="local" />
    </ActionSheetWrapper>
  );
};

export default ProgressDialog;
