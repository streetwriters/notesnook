import React from 'react';
import {ActivityIndicator, Text, TouchableOpacity, View} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {useTracked} from '../../provider';
import {Actions} from '../../provider/Actions';
import {eSendEvent, ToastEvent} from '../../services/EventManager';
import {showContext, SUBSCRIPTION_STATUS_STRINGS} from '../../utils';
import {db} from '../../utils/DB';
import {eOpenLoginDialog} from '../../utils/Events';
import {pv, SIZE, WEIGHT} from '../../utils/SizeUtils';
import {PressableButton} from '../PressableButton';
import {TimeSince} from './TimeSince';

export const UserSection = ({noTextMode}) => {
  const [state, dispatch] = useTracked();
  const {colors, syncing, user} = state;

  return user && user.username ? (
    <View
      style={{
        width: '100%',
        borderRadius: 0,
      }}>
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: colors.accent,
          paddingHorizontal: 6,
          paddingVertical: 8,
        }}>
        <Text
          style={{
            fontFamily: WEIGHT.regular,
            color: 'white',
            fontSize: SIZE.xs,
          }}>
          <Icon name="account-outline" /> {user.username}
        </Text>
        <Text
          style={{
            fontFamily: WEIGHT.regular,
            fontSize: SIZE.xs,
            color: 'white',
          }}>
          {SUBSCRIPTION_STATUS_STRINGS[user.subscription.status]}
        </Text>
      </View>

      <TouchableOpacity
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
          paddingHorizontal: 5,
          paddingVertical: 12,
        }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
          }}>
          <Text
            style={{
              fontFamily: WEIGHT.regular,
              color: colors.pri,
              fontSize: SIZE.sm,
              marginLeft: 5,
            }}>
            {syncing ? 'Syncing ' : 'Synced '}
            {!syncing ? (
              user?.lastSynced ? (
                <TimeSince time={user.lastSynced} />
              ) : (
                'never'
              )
            ) : null}
            {'\n'}
            <Text
              style={{
                fontSize: SIZE.xs,
                color: colors.icon,
              }}>
              {syncing ? 'Fetching your notes ' : 'Tap to sync '}
            </Text>
          </Text>
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
      onLongPress={(event) => {
        showContext(event, 'Login');
      }}
      color={noTextMode ? 'transparent' : colors.shade}
      selectedColor={colors.accent}
      alpha={!colors.night ? -0.02 : 0.1}
      opacity={0.12}
      customStyle={{
        paddingVertical: 12,
        marginVertical: 5,
        marginTop: pv + 5,
        borderRadius: noTextMode ? 0 : 5,
        width: noTextMode ? '100%' : '93%',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: noTextMode ? 'center' : 'flex-start',
        paddingHorizontal: noTextMode ? 0 : 12,
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
          <Text
            style={{
              fontFamily: WEIGHT.regular,
              color: colors.icon,
              fontSize: SIZE.xs,
            }}>
            You are not logged in
          </Text>
          <Text
            style={{
              color: colors.accent,
              fontSize: SIZE.sm - 2,
            }}>
            Login to sync notes.
          </Text>
        </View>
      )}
    </PressableButton>
  );
};
