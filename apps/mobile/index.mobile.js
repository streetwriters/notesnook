import React, {createRef, useEffect} from 'react';
import {Platform, StatusBar, View} from 'react-native';
import * as Animatable from 'react-native-animatable';
import Animated from 'react-native-reanimated';
import {Menu} from './src/components/Menu';
import SideMenu from './src/components/SideMenu';
import {useTracked} from './src/provider';
import {EditorOpacity, EditorPosition} from './src/utils/animations';
import {sideMenuRef} from './src/utils/refs';
import {DDS, w} from './src/utils/utils';
import Editor from './src/views/Editor';
import {NavigationStack} from './src/services/Navigator';

const editorRef = createRef();
export const Initialize = () => {
  const [state, dispatch] = useTracked();
  const {colors} = state;

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
        <View
          style={{
            width: DDS.isTab ? '70%' : '100%',
            height: '100%',
            backgroundColor: colors.bg,
          }}>
          <NavigationStack />
        </View>
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
          opacity: EditorOpacity,
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
