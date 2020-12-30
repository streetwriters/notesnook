import React from 'react';
import { ActivityIndicator, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTracked } from '../../provider';
import { eSendEvent, ToastEvent } from '../../services/EventManager';
import Sync from '../../services/Sync';
import { eOpenLoginDialog } from '../../utils/Events';
import { SIZE } from '../../utils/SizeUtils';
import Heading from '../Typography/Heading';
import Paragraph from '../Typography/Paragraph';
import { TimeSince } from './TimeSince';

export const UserSection = ({noTextMode}) => {
  const [state, dispatch] = useTracked();
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
          paddingVertical: 5,
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
          }}>
          <View
            style={{
              height: 8,
              width: 8,
              backgroundColor: !user ? colors.red : colors.green,
              borderRadius: 100,
              marginRight: 5,
            }}
          />
          <Heading size={SIZE.sm} color={colors.heading}>
            {!user ? 'Not Logged in' : 'Logged in'}
          </Heading>
        </TouchableOpacity>

        {user && (
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={Sync.run}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
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
                  <TimeSince style={{fontSize: SIZE.xs}} time={lastSynced} />
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
