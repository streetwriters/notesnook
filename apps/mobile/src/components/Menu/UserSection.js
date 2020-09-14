import React, {useEffect} from 'react';
import {
  ActivityIndicator,
  Platform,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {opacity, pv, SIZE, WEIGHT} from '../../common/common';
import {useTracked} from '../../provider';
import {ACTIONS} from '../../provider/actions';
import {eSendEvent} from '../../services/eventManager';
import {eOpenLoginDialog} from '../../services/events';
import NavigationService from '../../services/NavigationService';
import {db, DDS, hexToRGBA, ToastEvent} from '../../utils/utils';
import {TimeSince} from './TimeSince';
import {sideMenuRef} from '../../utils/refs';
import {PressableButton} from '../PressableButton';

export const UserSection = ({noTextMode}) => {
  const [state, dispatch] = useTracked();
  const {colors, syncing, user} = state;

  useEffect(() => {
    dispatch({type: ACTIONS.TAGS});
  }, []);

  return user && user.username ? (
    <View
      style={{
        width: '93%',
        borderRadius: 5,
        backgroundColor: Platform.ios
          ? hexToRGBA(colors.accent + '19')
          : hexToRGBA(colors.shade),
      }}>
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: colors.accent,
          borderRadius: 5,
          paddingHorizontal: 5,
          paddingVertical: 8,
          elevation: 2,
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
          Basic
        </Text>
      </View>

      <TouchableOpacity
        onPress={async () => {
          dispatch({
            type: ACTIONS.SYNCING,
            syncing: true,
          });
          try {
            if (!user) {
              let u = await db.user.get();
              dispatch({type: ACTIONS.USER, user: u});
            }
            await db.sync();
            ToastEvent.show('Sync Complete', 'success');
          } catch (e) {
            ToastEvent.show(e.message, 'error');
          }
          let u = await db.user.get();
          dispatch({type: ACTIONS.USER, user: u});
          dispatch({type: ACTIONS.ALL});
          dispatch({
            type: ACTIONS.SYNCING,
            syncing: false,
          });
        }}
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingHorizontal: 5,
          paddingVertical: pv + 5,
        }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
          }}>
          {syncing ? (
            <ActivityIndicator size={SIZE.xs} color={colors.accent} />
          ) : (
            <Icon color={colors.accent} name="sync" size={SIZE.sm} />
          )}
          <Text
            style={{
              fontFamily: WEIGHT.regular,
              color: colors.pri,
              fontSize: SIZE.xs,
              marginLeft: 5,
            }}>
            {syncing ? 'Syncing ' : 'Synced '}
            {!syncing ? (
              user.lastSynced && user.lastSynced !== 0 ? (
                <TimeSince time={user.lastSynced} />
              ) : (
                'never'
              )
            ) : null}
            {'\n'}
            <Text
              style={{
                fontSize: 8,
                color: colors.icon,
              }}>
              Tap to sync
            </Text>
          </Text>
        </View>
        <Icon
          size={SIZE.md}
          color={colors.accent}
          name="check-circle-outline"
        />
      </TouchableOpacity>
    </View>
  ) : (
    <PressableButton
      onPress={() => {
       eSendEvent(eOpenLoginDialog);
      }}
      color={colors.shade}
      selectedColor={colors.accent}
      alpha={!colors.night ? -0.02 : 0.1}
      opacity={0.12}
      customStyle={{
        paddingVertical: 12,
        marginVertical: 5,
        marginTop: pv + 5,
        borderRadius: 5,
        width: '93%',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: noTextMode ? 'center' : 'flex-start',
        paddingHorizontal: noTextMode ? 0 : 12,
      }}>
      <View
        style={{
          width: 30,
          backgroundColor: colors.accent,
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
          name="account-outline"
          color="white"
          size={SIZE.md}
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
