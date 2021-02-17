import React from 'react';
import {ActivityIndicator, TouchableOpacity, View} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {useTracked} from '../../provider';
import {DDS} from '../../services/DeviceDetection';
import {eSendEvent, ToastEvent} from '../../services/EventManager';
import Sync from '../../services/Sync';
import {eOpenLoginDialog} from '../../utils/Events';
import {SIZE} from '../../utils/SizeUtils';
import Heading from '../Typography/Heading';
import Paragraph from '../Typography/Paragraph';
import {TimeSince} from './TimeSince';

export const UserSection = ({noTextMode}) => {
  const [state] = useTracked();
  const {colors, syncing, user, lastSynced} = state;

  return (
    <View
      style={{
        width: '100%',
        alignSelf: 'center',
        backgroundColor: colors.nav,
      }}>
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingRight: 8,
          paddingLeft: 8,
        }}>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => {
            if (user) {
              ToastEvent.show('Logged in as ' + user?.email, 'success');
            } else {
              eSendEvent(eOpenLoginDialog);
            }
          }}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingVertical: 10,
          }}>
          <Icon
            style={{
              marginRight: 5,
            }}
            name="checkbox-blank-circle"
            size={10}
            color={!user ? colors.red : colors.green}
          />

          <View>
            <Heading size={SIZE.sm} color={colors.heading}>
              {!user ? 'Not logged in' : 'Logged in'}
            </Heading>

            {!user && (
              <Paragraph
                style={{
                  maxWidth: DDS.isLargeTablet() ? '96%' : '100%',
                }}
                color={colors.icon}>
                Login to encrypt and sync your notes.
              </Paragraph>
            )}
          </View>
        </TouchableOpacity>

        {user && (
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={Sync.run}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingVertical: 10,
            }}>
            <Paragraph
              style={{
                marginRight: 5,
              }}
              size={SIZE.xs}
              color={syncing ? colors.accent : colors.icon}>
              {syncing ? 'Syncing' : 'Synced '}

              {!syncing ? (
                lastSynced && lastSynced !== 'Never' ? (
                  <TimeSince
                    style={{fontSize: SIZE.xs, color: colors.icon}}
                    time={lastSynced}
                  />
                ) : (
                  'never'
                )
              ) : null}
            </Paragraph>
            {syncing ? (
              <ActivityIndicator size={SIZE.md} color={colors.accent} />
            ) : (
              <Icon color={colors.accent} name="sync" size={SIZE.md} />
            )}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};
