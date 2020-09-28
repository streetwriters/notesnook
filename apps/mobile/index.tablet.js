import React, {createRef, useEffect, useState} from 'react';
import {Platform, StatusBar, View} from 'react-native';
import * as Animatable from 'react-native-animatable';
import {ScreenContainer} from 'react-native-screens';
import {DialogManager} from './src/components/DialogManager';
import {Menu} from './src/components/Menu';
import {Toast} from './src/components/Toast';
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
import {MainComponent, NavigationStack} from './src/services/Navigator';
import Editor from './src/views/Editor';
const AnimatedScreenContainer = Animated.createAnimatedComponent(
  ScreenContainer,
);

const editorRef = createRef();
let outColors;

export const Initialize = () => {
  const [state, dispatch] = useTracked();
  const {colors} = state;
  return (
    <>
      <NavigationStack component={NavWrapper} />
      <Toast />
      <DialogManager colors={colors} />
    </>
  );
};

const NavWrapper = () => {
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
    }
    StatusBar.setBarStyle(colors.night ? 'light-content' : 'dark-content');
  }, []);
  return (
    <View
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
      <View
        style={{
          width: '28%',
          height: '100%',
          borderRightColor: colors.nav,
          borderRightWidth: 2,
        }}>
        <MainComponent />
      </View>

      <AnimatedScreenContainer
        ref={editorRef}
        style={{
          width: '68%',
          height: '100%',
          backgroundColor: 'transparent',
        }}>
        <Screen>
          <Editor noMenu={fullscreen ? false : true} />
        </Screen>
      </AnimatedScreenContainer>
    </View>
  );
};
