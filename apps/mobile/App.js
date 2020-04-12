import React, { useEffect, useState } from 'react';
import MMKV from 'react-native-mmkv-storage';
import Orientation from 'react-native-orientation';
import { Loading } from './Loading';
import { getColorScheme, scale, updateSize } from './src/common/common';
import { useTracked } from './src/provider';
import { ACTIONS } from './src/provider/actions';
import { defaultState } from './src/provider/defaultState';
import { eSubscribeEvent, eUnSubscribeEvent } from './src/services/eventManager';
import { eDispatchAction } from './src/services/events';
import { db, DDS } from './src/utils/utils';
import { test } from './src/utils/storage';



const App = () => {
  const [state, dispatch] = useTracked();
  const [init, setInit] = useState(false);
  const I = DDS.isTab ? require('./index.tablet') : require('./index.mobile');
  console.log(DDS.isTab, 'TABLET');
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
        dispatch({ type: ACTIONS.USER, user: user });

        setInit(true);
      });
    });
  }, []);

  async function Initialize(colors = colors) {
    let newColors = await getColorScheme(colors);

    let s;
    try {
      s = await MMKV.getStringAsync('settings');
    } catch (e) { }
    if (typeof s !== 'string') {
      s = defaultState.settings;
      s = JSON.stringify(s);
      s.fontScale = 1;

      await MMKV.setStringAsync('settings', s);

      dispatch({ type: ACTIONS.SETTINGS, s });
    } else {
      s = JSON.parse(s);
      if (s.fontScale) {
        scale.fontScale = s.fontScale;
      } else {
        scale.fontScale = 1;
      }
      updateSize();

      dispatch({ type: ACTIONS.SETTINGS, settings: { ...s } });
    }
    dispatch({ type: ACTIONS.THEME, colors: newColors });
  }

  if (!init) {
    return <></>;
  }
  return (
    <>
      <I.Initialize />
      <Loading />
    </>
  );
};

export default App;
