import React, {createRef, useEffect, useState} from 'react';
import {Platform, StatusBar, View} from 'react-native';
import * as Animatable from 'react-native-animatable';
import {Menu} from './src/components/Menu';
import {useTracked} from './src/provider';
import {
  eSendEvent,
  eSubscribeEvent,
  eUnSubscribeEvent,
} from './src/services/eventManager';
import {
  eCloseFullscreenEditor,
  eOnLoadNote,
  eOpenFullscreenEditor,
} from './src/services/events';
import {NavigationStack} from './src/services/Navigator';
import Editor from './src/views/Editor';
import {sideMenuRef} from './src/utils/refs';
import DrawerLayout from 'react-native-drawer-layout';
import {getElevation} from './src/utils/utils';
import {Toast} from './src/components/Toast';
import {DialogManager} from './src/components/DialogManager';

const editorRef = createRef();
let outColors;

export const Initialize = () => {
  const [state, dispatch] = useTracked();
  const {colors} = state;

  const [fullscreen, setFullscreen] = useState(false);

  useEffect(() => {
    outColors = colors;
  }, [colors]);

  const showFullScreenEditor = () => {
    setFullscreen(true);

    editorRef.current?.setNativeProps({
      style: {
        position: 'absolute',
        width: '100%',
        zIndex: 999,
        paddingHorizontal: 100,
        backgroundColor: outColors.bg,
      },
    });
  };

  const closeFullScreenEditor = () => {
    setFullscreen(false);
    editorRef.current?.setNativeProps({
      style: {
        position: 'relative',
        width: '68%',
        zIndex: null,
        paddingHorizontal: 0,
        backgroundColor: 'transparent',
      },
    });
  };

  useEffect(() => {
    eSendEvent(eOnLoadNote, {type: 'new'});
    eSubscribeEvent(eOpenFullscreenEditor, showFullScreenEditor);
    eSubscribeEvent(eCloseFullscreenEditor, closeFullScreenEditor);

    return () => {
      eUnSubscribeEvent(eOpenFullscreenEditor, showFullScreenEditor);
      eUnSubscribeEvent(eCloseFullscreenEditor, closeFullScreenEditor);
    };
  }, []);

  useEffect(() => {
    if (Platform.OS === 'android') {
      StatusBar.setBackgroundColor('transparent');
      StatusBar.setTranslucent(true);
      StatusBar.setBarStyle(colors.night ? 'light-content' : 'dark-content');
    } else {
      StatusBar.setBarStyle(colors.night ? 'light-content' : 'dark-content');
    }
  }, []);

  return (
    <>
      <DrawerLayout
        ref={sideMenuRef}
        style={{
          opacity: 0,
          backgroundColor: colors.bg,
        }}
        keyboardDismissMode="ondrag"
        drawerWidth={300}
        useNativeAnimations={true}
        renderNavigationView={() => (
          <Menu
            hide={false}
            colors={colors}
            close={() => sideMenuRef.current?.closeDrawer()}
          />
        )}>
        <Animatable.View
          transition="backgroundColor"
          duration={300}
          style={{
            width: '100%',
            height: '100%',
            flexDirection: 'row',
            backgroundColor: colors.bg,
          }}>
          <Animatable.View
            animation="fadeIn"
            useNativeDriver={true}
            duration={500}
            delay={450}
            style={{
              width: '4%',
            }}>
            <Menu hide={false} noTextMode={true} colors={colors} />
          </Animatable.View>
          <Animatable.View
            transition="backgroundColor"
            duration={300}
            style={{
              width: '28%',
              height: '100%',
              borderRightColor: colors.nav,
              borderRightWidth: 2,
            }}>
            <NavigationStack />
          </Animatable.View>

          <View
            ref={editorRef}
            style={{
              width: '68%',
              height: '100%',
              backgroundColor: 'transparent',
            }}>
            <Editor noMenu={fullscreen ? false : true} />
          </View>
        </Animatable.View>
      </DrawerLayout>

      <Toast />
      <DialogManager colors={colors} />
    </>
  );
};
