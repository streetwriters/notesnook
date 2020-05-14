import React, {createRef, useEffect, useState} from 'react';
import {Platform, StatusBar, View} from 'react-native';
import * as Animatable from 'react-native-animatable';
import DrawerLayout from 'react-native-drawer-layout';
import Animated from 'react-native-reanimated';
import {Menu} from './src/components/Menu';
import {useTracked} from './src/provider';
import {NavigationStack} from './src/services/Navigator';
import {
  EditorOpacity,
  EditorPosition,
  EditorScale,
} from './src/utils/animations';
import {sideMenuRef} from './src/utils/refs';
import {DDS} from './src/utils/utils';
import Editor from './src/views/Editor';
import {eSubscribeEvent, eUnSubscribeEvent} from './src/services/eventManager';
import {eOpenSideMenu, eCloseSideMenu} from './src/services/events';
import { Toast } from './src/components/Toast';
import { DialogManager } from './src/components/DialogManager';

const editorRef = createRef();
export const Initialize = () => {
  const [state, dispatch] = useTracked();
  const {colors} = state;
  const [locked, setLocked] = useState(false);

  useEffect(() => {
    if (Platform.OS === 'android') {
      StatusBar.setBackgroundColor('transparent');
      StatusBar.setTranslucent(true);
      StatusBar.setBarStyle(colors.night ? 'light-content' : 'dark-content');
    }
  }, []);

  const setGestureDisabled = () => {
    setLocked(true);
  };

  const setGestureEnabled = () => {
    setLocked(false);
  };

  useEffect(() => {
    eSubscribeEvent(eOpenSideMenu, setGestureEnabled);
    eSubscribeEvent(eCloseSideMenu, setGestureDisabled);
    return () => {
      eUnSubscribeEvent(eOpenSideMenu, setGestureEnabled);
      eUnSubscribeEvent(eCloseSideMenu, setGestureDisabled);
    };
  }, []);

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
        <DrawerLayout
          ref={sideMenuRef}
          style={{
            opacity: 0,
            backgroundColor: colors.bg,
          }}
          keyboardDismissMode="ondrag"
          drawerWidth={300}
          drawerLockMode={locked ? 'locked-closed' : 'unlocked'}
          useNativeAnimations={true}
          renderNavigationView={() => (
            <Menu
              hide={false}
              colors={colors}
              close={() => sideMenuRef.current?.closeDrawer()}
            />
          )}>
          <View
            style={{
              width: DDS.isTab ? '70%' : '100%',
              height: '100%',
              backgroundColor: colors.bg,
            }}>
            <NavigationStack />
          </View>
        </DrawerLayout>

        <Animated.View
          ref={editorRef}
          onResponderTerminationRequest={true}
          onStartShouldSetResponderCapture={false}
          onStartShouldSetResponder={false}
          onMoveShouldSetResponder={false}
          onMoveShouldSetResponderCapture={false}
          style={{
            width: '100%',
            height: '100%',
            alignSelf: 'flex-end',
            position: 'absolute',
            backgroundColor: colors.bg,
            elevation: 10,
            opacity: EditorOpacity,
            transform: [
              {
                translateX: EditorPosition,
              },
              {
                scaleX: EditorScale,
              },
              {
                scaleY: EditorScale,
              },
            ],
          }}>
          <Editor noMenu={false} />
        </Animated.View>
      </Animatable.View>
      <Toast />
      <DialogManager colors={colors} />
    </>
  );
};
