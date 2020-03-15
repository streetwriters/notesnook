import React, {useEffect, useState} from 'react';
import * as Animatable from 'react-native-animatable';
import MMKV from 'react-native-mmkv-storage';
import Orientation from 'react-native-orientation';
import {Loading} from './Loading';
import {getColorScheme, scale, updateSize} from './src/common/common';
import {DialogManager} from './src/components/DialogManager';
import {Toast} from './src/components/Toast';
import {useTracked} from './src/provider';
import {ACTIONS} from './src/provider/actions';
import {defaultState} from './src/provider/defaultState';
import {eSubscribeEvent, eUnSubscribeEvent} from './src/services/eventManager';
import {eDispatchAction} from './src/services/events';
import {db, DDS} from './src/utils/utils';

const I = DDS.isTab ? require('./index.tablet') : require('./index.mobile');

const App = () => {
  const [state, dispatch] = useTracked();
  const {colors} = state;
  const [init, setInit] = useState(false);

  const _onOrientationChange = o => {
    // Currently orientation is locked on tablet.
    /* DDS.checkOrientation();
    setTimeout(() => {
     
      forceUpdate();
    }, 1000); */
  };
  useEffect(() => {
    Orientation.addOrientationListener(_onOrientationChange);
    eSubscribeEvent(eDispatchAction, type => {
      dispatch(type);
    });
    return () => {
      eUnSubscribeEvent(eDispatchAction, type => {
        dispatch(type);
      });
      Orientation.removeOrientationListener(_onOrientationChange);
    };
  }, []);

  useEffect(() => {
    DDS.isTab ? Orientation.lockToLandscape() : Orientation.lockToPortrait();
  }, []);

  useEffect(() => {
    Initialize().then(() => {
      db.init().then(async () => {
        let user = await db.user.get();
        dispatch({type: ACTIONS.USER, user: user});

        setInit(true);
      });
    });
  }, []);

  async function Initialize(colors = colors) {
    let newColors = await getColorScheme(colors);
    let s = await MMKV.getString('settings');
    if (typeof s !== 'string') {
      s = defaultState.settings;

      s = JSON.stringify(s);
      await MMKV.setString('settings', s);
      dispatch({type: ACTIONS.SETTINGS, s});
    } else {
      s = JSON.parse(s);
      scale.fontScale = s.fontScale;

      updateSize();

      dispatch({type: ACTIONS.SETTINGS, settings: {...s}});
    }
    dispatch({type: ACTIONS.THEME, colors: newColors});
  }

  if (!init) {
    return <></>;
  }
  return (
    <>
      <Animatable.View
        transition="backgroundColor"
        duration={300}
        style={{
          width: '100%',
          height: '100%',
          flexDirection: 'row',
          backgroundColor: colors.bg,
        }}>
        <Loading />
        <I.Initialize />
        <Toast />
        <DialogManager colors={colors} />
      </Animatable.View>
    </>
  );
};

export default App;
