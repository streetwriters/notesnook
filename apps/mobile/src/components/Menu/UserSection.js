import React from 'react';
import {
  ActivityIndicator,
  Platform,
  TouchableOpacity,
  View
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {useTracked} from '../../provider';
import {useSettingStore, useUserStore} from '../../provider/stores';
import {DDS} from '../../services/DeviceDetection';
import {eSendEvent, ToastEvent} from '../../services/EventManager';
import Sync from '../../services/Sync';
import {eOpenLoginDialog} from '../../utils/Events';
import {SIZE} from '../../utils/SizeUtils';
import {PressableButton} from '../PressableButton';
import Heading from '../Typography/Heading';
import Paragraph from '../Typography/Paragraph';
import {TimeSince} from './TimeSince';

export const UserSection = () => {
  const [state] = useTracked();
  const {colors} = state;

  const user = useUserStore(state => state.user);
  const syncing = useUserStore(state => state.syncing);
  const lastSynced = useUserStore(state => state.lastSynced);
  const deviceMode = useSettingStore(state => state.deviceMode);

  const insets = useSafeAreaInsets();
  return (
    <View
      style={{
        width: '100%',
        alignSelf: 'center',
        paddingBottom: Platform.OS === 'ios' ? insets.bottom / 2 : null
      }}>
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingRight: 12,
          paddingLeft: 12
        }}>
        <PressableButton
          onPress={async () => {
            if (user) {
              await Sync.run();
            } else {
              eSendEvent(eOpenLoginDialog);
            }
          }}
          type="gray"
          customStyle={{
            flexDirection: 'row',
            justifyContent: 'flex-start',
            padding: 12,
            borderBottomRightRadius: 0,
            borderBottomLeftRadius: 0
          }}>
          <View
            style={{
              flexShrink: 1,
              flexGrow: 1
            }}>
            <Heading
              style={{
                flexWrap: 'wrap'
              }}
              size={SIZE.xs}
              color={colors.icon}>
              {!user ? (
                'You are not logged in'
              ) : !syncing ? (
                lastSynced && lastSynced !== 'Never' ? (
                  <>
                    Last synced{' '}
                    <TimeSince
                      style={{fontSize: SIZE.xs, color: colors.icon}}
                      time={lastSynced}
                    />
                  </>
                ) : (
                  'never'
                )
              ) : (
                'Syncing your notes'
              )}{' '}
              <Icon
                name="checkbox-blank-circle"
                size={9}
                color={!user ? colors.red : colors.green}
              />
            </Heading>

            <Paragraph
              style={{
                flexWrap: 'wrap'
              }}
              color={colors.heading}>
              {!user
                ? 'Login to sync your notes.'
                : 'Tap here to sync your notes.'}
            </Paragraph>
          </View>

          {user ? (
            syncing ? (
              <ActivityIndicator size={SIZE.lg} color={colors.accent} />
            ) : (
              <Icon color={colors.accent} name="sync" size={SIZE.lg} />
            )
          ) : null}
        </PressableButton>
      </View>
    </View>
  );
};
