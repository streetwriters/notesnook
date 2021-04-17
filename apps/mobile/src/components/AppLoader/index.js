import React, {useEffect, useState} from 'react';
import {View} from 'react-native';
import Animated, {Easing} from 'react-native-reanimated';
import AnimatedProgress from 'react-native-reanimated-progress-bar';
import {useTracked} from '../../provider';
import {Actions} from '../../provider/Actions';
import {
  eSendEvent,
  eSubscribeEvent,
  eUnSubscribeEvent,
} from '../../services/EventManager';
import { editing } from '../../utils';
import {changeContainerScale, ContainerScale} from '../../utils/Animations';
import {db} from '../../utils/DB';
import {eOpenRateDialog, eOpenSideMenu} from '../../utils/Events';
import {MMKV} from '../../utils/mmkv';
import {tabBarRef} from '../../utils/Refs';
import {sleep} from '../../utils/TimeUtils';
import { setNoteOnly } from '../../views/Editor/Functions';

const scaleV = new Animated.Value(0.95);
const opacityV = new Animated.Value(1);
const AppLoader = ({onLoad}) => {
  const [state, dispatch] = useTracked();
  const colors = state.colors;
  const [loading, setLoading] = useState(true);
  const [opacity, setOpacity] = useState(true);

  const load = async value => {
    if (value === 'hide') {
      setLoading(true);
      opacityV.setValue(1);
      return;
    }
    if (value === 'show') {
      opacityV.setValue(0);
      setLoading(false);
      return;
    }

    eSendEvent(eOpenSideMenu);
    setOpacity(false);
    await sleep(2);
    Animated.timing(opacityV, {
      toValue: 0,
      duration: 150,
      easing: Easing.out(Easing.ease),
    }).start();
    changeContainerScale(ContainerScale, 1, 600);
    await sleep(150);
    setLoading(false);
    
    animation = false;
    await db.notes.init();
    dispatch({type: Actions.NOTES});
    dispatch({type: Actions.FAVORITES});
    dispatch({type: Actions.LOADING, loading: false});
    eSendEvent(eOpenSideMenu);
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
    onLoad();
    return () => {
      eUnSubscribeEvent('load_overlay', load);
    };
  }, []);

  return (
    loading && (
      <Animated.View
        style={{
          backgroundColor: opacity ? colors.bg : 'rgba(0,0,0,0)',
          width: '100%',
          height: '100%',
          position: 'absolute',
          zIndex: 999,
          borderRadius: 10,
        }}>
        <Animated.View
          onTouchStart={() => {
            setLoading(false);
          }}
          style={{
            backgroundColor: colors.bg,
            width: '100%',
            height: '100%',
            justifyContent: 'center',
            alignItems: 'center',
            borderRadius: 10,
            opacity: opacityV,
          }}>
          <View
            style={{
              height: 10,
              flexDirection: 'row',
              width: 100,
            }}>
            <AnimatedProgress fill={colors.accent} current={4} total={4} />
          </View>
        </Animated.View>
      </Animated.View>
    )
  );
};

export default AppLoader;
