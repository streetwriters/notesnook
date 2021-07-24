import React, {useEffect, useState} from 'react';
import {SafeAreaView, View} from 'react-native';
import Animated, {Easing} from 'react-native-reanimated';
import AnimatedProgress from 'react-native-reanimated-progress-bar';
import {useTracked} from '../../provider';
import {
  useFavoriteStore,
  useNoteStore,
  useUserStore
} from '../../provider/stores';
import BiometricService from '../../services/BiometricService';
import {DDS} from '../../services/DeviceDetection';
import {
  eSendEvent,
  eSubscribeEvent,
  eUnSubscribeEvent
} from '../../services/EventManager';
import {editing} from '../../utils';
import {db} from '../../utils/DB';
import {eOpenLoginDialog, eOpenRateDialog} from '../../utils/Events';
import {MMKV} from '../../utils/mmkv';
import {tabBarRef} from '../../utils/Refs';
import {SIZE} from '../../utils/SizeUtils';
import {sleep} from '../../utils/TimeUtils';
import {Button} from '../Button';
import Input from '../Input';
import Seperator from '../Seperator';
import SplashScreen from '../SplashScreen';
import Heading from '../Typography/Heading';
import Paragraph from '../Typography/Paragraph';

let passwordValue = null;
let didVerifyUser = false;
const opacityV = new Animated.Value(1);
const AppLoader = ({onLoad}) => {
  const [state] = useTracked();
  const colors = state.colors;
  const [loading, setLoading] = useState(true);
  const setNotes = useNoteStore(state => state.setNotes);
  const setFavorites = useFavoriteStore(state => state.setFavorites);
  const _setLoading = useNoteStore(state => state.setLoading);
  const user = useUserStore(state => state.user);
  const verifyUser = useUserStore(state => state.verifyUser);
  const setVerifyUser = useUserStore(state => state.setVerifyUser);

  const load = async value => {
    if (verifyUser) return;
    if (value === 'hide') {
      setLoading(true);
      opacityV.setValue(1);
      return;
    }
    let appState = await MMKV.getItem('appState');
    if (appState) {
      appState = JSON.parse(appState);
      if (
        appState.note &&
        !appState.note.locked &&
        !appState.movedAway &&
        Date.now() < appState.timestamp + 3600000
      ) {
        editing.isRestoringState = true;
        editing.currentlyEditing = true;
        editing.movedAway = false;
        if (!DDS.isTab) {
          tabBarRef.current?.goToPage(1);
        }
        eSendEvent('loadingNote', appState.note);
      }
    }

    if (value === 'show') {
      opacityV.setValue(0);
      setLoading(false);
      return;
    }
    Animated.timing(opacityV, {
      toValue: 0,
      duration: 100,
      easing: Easing.out(Easing.ease)
    }).start();
    setLoading(false);
    await db.notes.init();
    setNotes();
    setFavorites();
    _setLoading(false);
    await sleep(1000);
    if ((await MMKV.getItem('loginSessionHasExpired')) === 'expired') {
      eSendEvent(eOpenLoginDialog, 4);
      return;
    }
    let askForRating = await MMKV.getItem('askForRating');
    if (askForRating !== 'never' || askForRating !== 'completed') {
      askForRating = JSON.parse(askForRating);
      if (askForRating?.timestamp < Date.now()) {
        eSendEvent(eOpenRateDialog);
      }
    }
  };

  useEffect(() => {
    eSubscribeEvent('load_overlay', load);
    if (!verifyUser) {
      if (!didVerifyUser) {
        onLoad();
      } else {
        load();
      }
    }
    if (verifyUser) {
      onUnlockBiometrics();
    }
    return () => {
      eUnSubscribeEvent('load_overlay', load);
    };
  }, [verifyUser]);

  const onUnlockBiometrics = async () => {
    let verified = await BiometricService.validateUser(
      'Unlock to access your notes',
      ''
    );
    if (verified) {
      didVerifyUser = true;
      setVerifyUser(false);
      passwordValue = null;
    }
  };

  const onSubmit = async () => {
    if (!passwordValue) return;
    try {
      let verified = await db.user.verifyPassword(passwordValue);
      if (verified) {
        didVerifyUser = true;
        setVerifyUser(false);
        passwordValue = null;
      }
    } catch (e) {}
  };

  return loading ? (
    <Animated.View
      style={{
        backgroundColor: colors.bg,
        width: '100%',
        height: '100%',
        position: 'absolute',
        zIndex: 999,
        borderRadius: 10
      }}>
      <Animated.View
        style={{
          backgroundColor: colors.bg,
          width: '100%',
          height: '100%',
          justifyContent: 'center',
          alignItems: 'center',
          borderRadius: 10,
          opacity: opacityV
        }}>
        {verifyUser ? (
          <SafeAreaView
            style={{
              flex: 1,
              justifyContent: 'center',
              width: '100%',
              paddingHorizontal: 12
            }}>
            <Heading>Verify your identity</Heading>
            {user ? (
              <>
                <Paragraph>
                  To keep your notes secure, please enter password of the
                  account you are logged in to.
                </Paragraph>
                <Input
                  secureTextEntry
                  placeholder="Enter account password"
                  onChangeText={v => (passwordValue = v)}
                  onSubmit={onSubmit}
                />
                <Button
                  title="Unlock"
                  type="accent"
                  onPress={onSubmit}
                  width="100%"
                  height={50}
                  fontSize={SIZE.md}
                />
                <Seperator />
              </>
            ) : (
              <>
                <Paragraph>
                  To keep your notes secure, please unlock app the with
                  biometrics.
                </Paragraph>
                <Seperator />
              </>
            )}

            <Button
              title="Unlock with Biometrics"
              width="100%"
              height={50}
              onPress={onUnlockBiometrics}
              icon={'fingerprint'}
              type={!user ? 'accent' : 'transparent'}
              fontSize={SIZE.md}
            />
          </SafeAreaView>
        ) : (
          <View
            style={{
              height: 10,
              flexDirection: 'row',
              width: 100
            }}>
            <AnimatedProgress fill={colors.accent} current={4} total={4} />
          </View>
        )}
      </Animated.View>
    </Animated.View>
  ) : (
    <SplashScreen />
  );
};

export default AppLoader;
