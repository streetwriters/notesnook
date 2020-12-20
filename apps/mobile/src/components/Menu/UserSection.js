import React from 'react';
import { ActivityIndicator, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTracked } from '../../provider';
import { DDS } from '../../services/DeviceDetection';
import { eSendEvent } from '../../services/EventManager';
import Sync from '../../services/Sync';
import { eOpenLoginDialog } from '../../utils/Events';
import { pv, SIZE } from '../../utils/SizeUtils';
import { PressableButton } from '../PressableButton';
import Paragraph from '../Typography/Paragraph';
import { TimeSince } from './TimeSince';

export const UserSection = ({noTextMode}) => {
  const [state, dispatch] = useTracked();
  const {colors, syncing, user} = state;

  return user && user?.email ? (
    <View
      style={{
        width: '100%',
        borderRadius: 5,
        alignSelf: 'center',
        backgroundColor: colors.shade,
        marginTop: 10,
      }}>
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={Sync.run}
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingRight: 12,
          paddingLeft: 6,
          paddingVertical: 12,
        }}>
        <View>
          <Paragraph
            size={DDS.isLargeTablet() ? SIZE.xxs : SIZE.xs}
            color={colors.icon}
            style={{
              color: colors.icon,
            }}>
            {syncing ? 'Syncing ' : 'Last synced: '}
            {!syncing ? (
              user?.lastSynced ? (
                <TimeSince time={user?.lastSynced} />
              ) : (
                'never'
              )
            ) : null}
          </Paragraph>
          <Paragraph color={colors.accent}>
            {syncing ? 'Fetching your notes ' : 'Tap to sync '}
          </Paragraph>
        </View>
        {syncing ? (
          <ActivityIndicator size={SIZE.lg} color={colors.accent} />
        ) : (
          <Icon color={colors.accent} name="sync" size={SIZE.lg} />
        )}
      </TouchableOpacity>
    </View>
  ) : (
    <PressableButton
      onPress={() => {
        eSendEvent(eOpenLoginDialog);
      }}
      type="shade"
      customStyle={{
        paddingVertical: 12,
        marginVertical: 5,
        marginTop: pv + 5,
        borderRadius: 5,
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-start',
        paddingHorizontal: 8,
      }}>
      <View
        style={{
          width: 30,
          backgroundColor: noTextMode ? 'transparent' : colors.accent,
          height: 30,
          borderRadius: 100,
          alignItems: 'center',
          justifyContent: 'center',
        }}>
        <Icon
          style={{
            textAlign: 'center',
            textAlignVertical: 'center',
          }}
          name={noTextMode ? 'login-variant' : 'account-outline'}
          color={noTextMode ? colors.accent : 'white'}
          size={noTextMode ? SIZE.md + 5 : SIZE.md + 1}
        />
      </View>
      {noTextMode ? null : (
        <View
          style={{
            marginLeft: DDS.isLargeTablet() ? 5 : 10,
            flex: 1,
          }}>
          {DDS.isLargeTablet() ? null : (
            <Paragraph size={SIZE.xs} color={colors.icon}>
              You are not logged in
            </Paragraph>
          )}
          <Paragraph
            style={{
              flexWrap: 'wrap',
            }}
            color={colors.accent}>
            Login to sync notes.
          </Paragraph>
        </View>
      )}
    </PressableButton>
  );
};
