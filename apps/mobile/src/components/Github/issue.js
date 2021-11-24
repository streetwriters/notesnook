import React, {useRef, useState} from 'react';
import {Linking, Platform, Text, TextInput, View} from 'react-native';
import deviceInfoModule from 'react-native-device-info';
import {useTracked} from '../../provider';
import {eSendEvent, ToastEvent} from '../../services/EventManager';
import {APP_VERSION} from '../../utils';
import {db} from '../../utils/database';
import {eCloseProgressDialog} from '../../utils/Events';
import {openLinkInBrowser} from '../../utils/functions';
import {SIZE} from '../../utils/SizeUtils';
import {sleep} from '../../utils/TimeUtils';
import {Button} from '../Button';
import DialogHeader from '../Dialog/dialog-header';
import {presentDialog} from '../Dialog/functions';
import Seperator from '../Seperator';
import Paragraph from '../Typography/Paragraph';

export const Issue = () => {
  const [state, dispatch] = useTracked();
  const colors = state.colors;
  const body = useRef(null);
  const title = useRef(null);
  const [loading, setLoading] = useState(false);

  const onPress = async () => {
    if (loading) return;
    if (!title.current || !body.current) return;
    if (title.current?.trim() === '' || body.current?.trim().length === 0)
      return;
    try {
      setLoading(true);

      let issue_url = await db.debug.report(
        title.current,
        body.current +
          `\n_______________
**Device information:**
App version: ${APP_VERSION}
Platform: ${Platform.OS}
Model: ${Platform.constants.Brand}-${Platform.constants.Model}-${Platform.constants.Version}`
      );
      setLoading(false);
      eSendEvent(eCloseProgressDialog);
      await sleep(300);
      presentDialog({
        title: 'Issue reported',
        paragraph: (
          <Text>
            You can track your issue at{' '}
            <Text
              style={{
                textDecorationLine: 'underline',
                color: colors.accent
              }}
              onPress={() => {
                Linking.openURL(issue_url);
              }}>
              {issue_url}
            </Text>
          </Text>
        ),
        negativeText: 'Close'
      });
    } catch (e) {
      setLoading(false);
      ToastEvent.show({
        heading: 'An error occured',
        message: e.message,
        type: 'error'
      });
    }
  };

  return (
    <View
      style={{
        paddingHorizontal: 12
      }}>
      <DialogHeader
        title="Report issue"
        paragraph="Let us know if you have faced any issue/bug while using Notesnook."
      />

      <Seperator half />

      <TextInput
        placeholder="Title"
        onChangeText={v => (title.current = v)}
        style={{
          borderWidth: 1,
          borderColor: colors.nav,
          borderRadius: 5,
          padding: 12,
          fontFamily: 'OpenSans-Regular',
          marginBottom: 10,
          fontSize: SIZE.md
        }}
      />

      <TextInput
        placeholder={`Tell us more about the issue you are facing.
        
For example:
- Steps to reproduce the issue
- Things you have tried etc.`}
        multiline
        numberOfLines={5}
        textAlignVertical="top"
        onChangeText={v => (body.current = v)}
        style={{
          borderWidth: 1,
          borderColor: colors.nav,
          borderRadius: 5,
          padding: 12,
          fontFamily: 'OpenSans-Regular',
          maxHeight: 200,
          fontSize: SIZE.sm,
          marginBottom: 2.5
        }}
      />
      <Paragraph
        size={SIZE.xs}
        color={
          colors.icon
        }>{`App version: ${APP_VERSION} Platform: ${Platform.OS} Model: ${Platform.constants.Brand}-${Platform.constants.Model}-${Platform.constants.Version}`}</Paragraph>

      <Seperator />
      <Button
        onPress={onPress}
        title={loading ? null : 'Submit'}
        loading={loading}
        height={50}
        width="100%"
        type="accent"
      />

      <Paragraph
        color={colors.icon}
        size={SIZE.xs}
        style={{
          marginTop: 10,
          textAlign: 'center'
        }}>
        The information above will be is publically available on{' '}
        <Text
          onPress={() => {
            Linking.openURL('https://github.com/streetwriters/notesnook');
          }}
          style={{
            textDecorationLine: 'underline',
            color: colors.accent
          }}>
          github.com/streetwriters/notesnook.
        </Text>{' '}
        If you want to ask something general or need some assistance, we would
        suggest that you{' '}
        <Text
          style={{
            textDecorationLine: 'underline',
            color: colors.accent
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
