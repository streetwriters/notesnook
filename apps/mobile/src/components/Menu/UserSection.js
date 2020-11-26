import React from 'react';
import {ActivityIndicator, TouchableOpacity, View} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {useTracked} from '../../provider';
import {Actions} from '../../provider/Actions';
import {eSendEvent, ToastEvent} from '../../services/EventManager';
import {showContext, SUBSCRIPTION_STATUS_STRINGS} from '../../utils';
import {db} from '../../utils/DB';
import {eOpenLoginDialog} from '../../utils/Events';
import {pv, SIZE} from '../../utils/SizeUtils';
import {PressableButton} from '../PressableButton';
import Paragraph from '../Typography/Paragraph';
import {TimeSince} from './TimeSince';

export const UserSection = ({noTextMode}) => {
  const [state, dispatch] = useTracked();
  const {colors, syncing, user} = state;

  return user && user.username ? (
    <View
      style={{
        width: '100%',
        borderRadius: 5,
        alignSelf: 'center',
        backgroundColor: colors.shade,
      }}>
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: colors.accent,
          paddingHorizontal: 6,
          paddingVertical: 6,
          borderTopRightRadius: 5,
          borderTopLeftRadius: 5,
        }}>
        <Paragraph color="white">
          <Icon name="account-outline" /> {user.username}
        </Paragraph>
        <Paragraph color="white" size={SIZE.xs}>
          {SUBSCRIPTION_STATUS_STRINGS[user.subscription.status]}
        </Paragraph>
      </View>

      <TouchableOpacity
        activeOpacity={0.8}
        onPress={async () => {
          dispatch({
            type: Actions.SYNCING,
            syncing: true,
          });
          try {
            if (!user) {
              let u = await db.user.get();
              dispatch({type: Actions.USER, user: u});
            }
            await db.sync();
            ToastEvent.show('Sync Complete', 'success');
          } catch (e) {
            ToastEvent.show(e.message, 'error');
          }
          let u = await db.user.get();
          dispatch({type: Actions.USER, user: u});
          dispatch({type: Actions.ALL});
          dispatch({
            type: Actions.SYNCING,
            syncing: false,
          });
        }}
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingRight: 5,
          paddingVertical: 12,
        }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
          }}>
          <Paragraph
            style={{
              marginLeft: 5,
            }}>
            {syncing ? 'Syncing ' : 'Last synced: '}
            {!syncing ? (
              user?.lastSynced ? (
                <TimeSince time={user.lastSynced} />
              ) : (
                'never'
              )
            ) : null}
            {'\n'}
            <Paragraph
              size={SIZE.xs}
              color={colors.icon}
              style={{
                fontSize: SIZE.xs,
                color: colors.icon,
              }}>
              {syncing ? 'Fetching your notes ' : 'Tap to sync '}
            </Paragraph>
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
      color={colors.accent}
      selectedColor={colors.accent}
      alpha={!colors.night ? -0.02 : 0.1}
      opacity={0.12}
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
            marginLeft: 10,
          }}>
          <Paragraph size={SIZE.xs} color={colors.icon}>
            You are not logged in
          </Paragraph>
          <Paragraph color={colors.accent}>Login to sync notes.</Paragraph>
        </View>
      )}
    </PressableButton>
  );
};
