import React, { useEffect, createRef } from 'react';
import Animated from 'react-native-reanimated';
import { Menu } from './src/components/Menu';
import * as Animatable from 'react-native-animatable';
import SideMenu from './src/components/SideMenu';
import { EditorPosition, EditorOpacity } from './src/utils/animations';
import { sideMenuRef } from './src/utils/refs';
import { DDS, w } from './src/utils/utils';
import Editor from './src/views/Editor';
import { useTracked } from './src/provider';
import { StatusBar, Platform } from 'react-native';
import { AppContainer } from './src/services/AppContainer';
import NavigationService from './src/services/NavigationService';
import { useSafeArea } from 'react-native-safe-area-context';

const editorRef = createRef();
export const Initialize = () => {
  const [state, dispatch] = useTracked();
  const { colors } = state;

  useEffect(() => {
    if (Platform.OS === 'android') {
      StatusBar.setBackgroundColor('transparent');
      StatusBar.setTranslucent(true);
      StatusBar.setBarStyle(colors.night ? 'light-content' : 'dark-content');
    }
  }, []);
  return (
    <Animatable.View
      transition="backgroundColor"
      duration={300}
      style={{
        width: '100%',
        height: '100%',
        flexDirection: 'row',
        backgroundColor: colors.bg,
      }}>
      <SideMenu
        ref={sideMenuRef}
        bounceBackOnOverdraw={false}
        contentContainerStyle={{
          opacity: 0,
          backgroundColor: colors.bg,
        }}
        menu={
          <Menu
            hide={false}
            colors={colors}
            close={() =>
              sideMenuRef.current?.openMenu(!sideMenuRef.current?.isOpen)
            }
          />
        }
        openMenuOffset={w / 1.5}>
        <AppContainer
          style={{
            width: DDS.isTab ? '70%' : '100%',
            height: '100%',
            backgroundColor: colors.bg,
          }}
          ref={navigatorRef => {
            NavigationService.setTopLevelNavigator(navigatorRef);
          }}
        />
      </SideMenu>

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
          opacity:EditorOpacity,
          transform: [
            {
              translateX: EditorPosition,
            },
          ],
        }}>
        <Editor noMenu={false} />
      </Animated.View>
    </Animatable.View>
  );
};
