import React, { useEffect, useRef, useState } from 'react';
import { Linking, Platform, View } from 'react-native';
import { eSubscribeEvent, eUnSubscribeEvent } from '../../../services/EventManager';
import { eCloseRateDialog, eOpenRateDialog } from '../../../utils/events';
import { MMKV } from '../../../utils/database/mmkv';
import { SIZE } from '../../../utils/size';
import SheetWrapper from '../../ui/sheet';
import { Button } from '../../ui/button';
import Seperator from '../../ui/seperator';
import Heading from '../../ui/typography/heading';
import Paragraph from '../../ui/typography/paragraph';
import { STORE_LINK } from '../../../utils/constants';
import { clearMessage } from '../../../services/Message';

const RateAppSheet = () => {
  const [visible, setVisible] = useState(false);
  const actionSheetRef = useRef();

  useEffect(() => {
    eSubscribeEvent(eOpenRateDialog, open);
    eSubscribeEvent(eCloseRateDialog, close);
    return () => {
      eUnSubscribeEvent(eOpenRateDialog, open);
      eUnSubscribeEvent(eCloseRateDialog, close);
    };
  }, []);

  const open = () => {
    setVisible(true);
  };
  useEffect(() => {
    if (visible) {
      actionSheetRef.current?.show();
    }
  }, [visible]);

  const close = () => {
    actionSheetRef.current?.hide();
  };

  return !visible ? null : (
    <SheetWrapper
      centered={false}
      fwdRef={actionSheetRef}
      onClose={async () => {
        await MMKV.setItem(
          'askForRating',
          JSON.stringify({
            timestamp: Date.now() + 86400000 * 2
          })
        );
        setVisible(false);
        clearMessage();
      }}
    >
      <View
        style={{
          width: '100%',
          alignSelf: 'center',
          paddingHorizontal: 12
        }}
      >
        <Heading>Do you enjoy using Notesnook?</Heading>
        <Paragraph size={SIZE.md}>
          It took us a year to bring Notesnook to life. Share your experience and suggestions to
          help us improve it.
        </Paragraph>

        <Seperator half />
        <Button
          onPress={async () => {
            await Linking.openURL(STORE_LINK);
            await MMKV.setItem('askForRating', 'completed');
            setVisible(false);
            clearMessage();
          }}
          fontSize={SIZE.md}
          width="100%"
          height={50}
          type="accent"
          title="Rate now (It takes only a second)"
        />
        <View
          style={{
            alignItems: 'center',
            justifyContent: 'space-between',
            flexDirection: 'row',
            paddingTop: 12,
            width: '100%',
            alignSelf: 'center'
          }}
        >
          <Button
            onPress={async () => {
              await MMKV.setItem('askForRating', 'never');
              setVisible(false);
              clearMessage();
            }}
            fontSize={SIZE.md}
            type="error"
            width="48%"
            height={50}
            title="Never"
          />
          <Button
            onPress={async () => {
              await MMKV.setItem(
                'askForRating',
                JSON.stringify({
                  timestamp: Date.now() + 86400000 * 2
                })
              );
              setVisible(false);
              clearMessage();
            }}
            fontSize={SIZE.md}
            width="48%"
            height={50}
            type="grayBg"
            title="Later"
          />
        </View>
      </View>
    </SheetWrapper>
  );
};

export default RateAppSheet;
