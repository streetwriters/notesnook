import React from 'react';
import { View } from 'react-native';
import { useTracked } from '../../provider';
import { eSendEvent, presentSheet } from '../../services/EventManager';
import { eCloseAnnouncementDialog, eOpenPremiumDialog } from '../../utils/Events';
import { openLinkInBrowser } from '../../utils/functions';
import { SIZE } from '../../utils/SizeUtils';
import { sleep } from '../../utils/TimeUtils';
import { SettingsBackupAndRestore } from '../../views/Settings';
import { Button } from '../Button';
import { allowedOnPlatform, getStyle } from './functions';

export const Cta = ({actions, style = {}, color}) => {
  const [state] = useTracked();
  const colors = state.colors;
  let buttons =
    actions.filter(item =>
      allowedOnPlatform(item.platforms)
    ) || [];

  const onPress = async item => {
    eSendEvent(eCloseAnnouncementDialog);
    await sleep(500);
    if (item.type === 'link') {
      try {
        await openLinkInBrowser(item.data, colors);
      } catch (e) {}
    } else if (item.type === 'promo') {
      eSendEvent(eOpenPremiumDialog, {
        promoCode: item.data,
        text: item.title
      });
    } else if (item.type === 'backup') {
      presentSheet({
        title: 'Backup & restore',
        paragraph: 'Please enable automatic backups to keep your data safe',
        noProgress: true,
        noIcon: true,
        component: <SettingsBackupAndRestore isSheet={true} />
      });
    }
  };
  return (
    <View
      style={{
        paddingHorizontal: 12,
        ...getStyle(style)
      }}>
      {buttons.length > 0 &&
        buttons.slice(0, 1).map(item => (
          <Button
            key={item.title}
            title={item.title}
            fontSize={SIZE.md}
            buttonType={{
              color: color ? color : colors.accent,
              text: colors.light,
              selected: color ? color : colors.accent,
              opacity: 1
            }}
            onPress={() => onPress(item)}
            width={'100%'}
            style={{
              marginBottom: 5
            }}
          />
        ))}

      {buttons.length > 1 &&
        buttons.slice(1, 2).map((item, index) => (
          <Button
            key={item.title}
            title={item.title}
            fontSize={SIZE.xs + 1}
            type="gray"
            onPress={() => onPress(item)}
            width={null}
            height={20}
            style={{
              minWidth: '50%'
            }}
            textStyle={{
              textDecorationLine: 'underline'
            }}
          />
        ))}
    </View>
  );
};
