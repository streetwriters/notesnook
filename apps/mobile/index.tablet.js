import React, {useEffect} from 'react';
import {View, Platform, StatusBar} from 'react-native';
import * as Animatable from 'react-native-animatable';
import {Menu} from './src/components/Menu';
import {ModalMenu} from './src/components/ModalMenu';
import NavigationService, {
  AppContainer,
} from './src/services/NavigationService';
import Editor from './src/views/Editor';
import {useTracked} from './src/provider';

let editorRef;
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

    editorRef.setNativeProps({
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
    editorRef.setNativeProps({
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
    }
  }, []);

  return (
    <>
      <ModalMenu colors={colors} />
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
        <AppContainer
          style={{
            width: '100%',
            height: '100%',
          }}
          ref={navigatorRef => {
            NavigationService.setTopLevelNavigator(navigatorRef);
          }}
        />
      </Animatable.View>
      <View
        ref={ref => (editorRef = ref)}
        style={{
          width: '68%',
          height: '100%',
          backgroundColor: 'transparent',
        }}>
        <Editor noMenu={fullscreen ? false : true} />
      </View>
    </>
  );
};
