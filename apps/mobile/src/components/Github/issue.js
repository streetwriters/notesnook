import React, {useRef} from 'react';
import {Text, TextInput, View} from 'react-native';
import {useTracked} from '../../provider';
import { eSendEvent } from '../../services/EventManager';
import { eCloseProgressDialog } from '../../utils/Events';
import {openLinkInBrowser} from '../../utils/functions';
import {SIZE} from '../../utils/SizeUtils';
import { sleep } from '../../utils/TimeUtils';
import {Button} from '../Button';
import DialogHeader from '../Dialog/dialog-header';
import { presentDialog } from '../Dialog/functions';
import Seperator from '../Seperator';
import Paragraph from '../Typography/Paragraph';

export const Issue = () => {
  const [state, dispatch] = useTracked();
  const colors = state.colors;
  const value = useRef(null);

  onPress = async () => {

    eSendEvent(eCloseProgressDialog);
    await sleep(300);
    presentDialog({
      title:"Issue submitted",
      paragraph:"The issue you submitted has been published on github",
      positiveText:"View",
      negativeText:"Done",
      positivePress:async () => {
        
      }
    })

  };

  return (
    <View
      style={{
        paddingHorizontal: 12
      }}>
      <DialogHeader
        title="Submit an issue"
        paragraph="Let us know if you are facing any issue while using Notesnook."
      />

      <Seperator half />

      <TextInput
        placeholder="Tell us what issue you have faced."
        multiline
        numberOfLines={5}
        textAlignVertical="top"
        onChangeText={v => (value.current = v)}
        style={{
          borderWidth: 1,
          borderColor: colors.nav,
          borderRadius: 10,
          padding: 12,
          fontFamily: 'OpenSans-Regular',
          maxHeight: 150
        }}
      />

      <Seperator />
      <Button
        onPress={onPress}
        title="Submit"
        height={50}
        width="100%"
        type="accent"
      />

      <Paragraph
        color={colors.icon}
        size={SIZE.xs + 1}
        style={{
          marginTop: 10,
          textAlign: 'center'
        }}>
        If you want to ask something general or request a feature, we would suggest that
        you{' '}
        <Text
          style={{
            textDecorationLine: 'underline'
          }}
          onPress={async () => {
            try {
              await openLinkInBrowser('https://discord.gg/zQBK97EE22', colors);
            } catch (e) {}
          }}>
          join our community on Discord.
        </Text>
      </Paragraph>
    </View>
  );
};
