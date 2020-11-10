import React, {createRef, useEffect, useState} from 'react';
import {Platform, StatusBar, View} from 'react-native';
import ContextMenu from './src/components/ContextMenu';
import {DialogManager} from './src/components/DialogManager';
import {Toast} from './src/components/Toast';
import {useTracked} from './src/provider';
import {
  eSendEvent,
  eSubscribeEvent,
  eUnSubscribeEvent,
} from './src/services/EventManager';
import {
  eCloseFullscreenEditor,
  eOnLoadNote,
  eOpenFullscreenEditor,
} from './src/utils/Events';
import {NavigatorStack} from './src/navigation/NavigatorStack';
import Editor from './src/views/Editor';
import {NavigationStack} from "./src/navigation/Drawer";

const editorRef = createRef();
let outColors;

export const Initialize = () => {
  return (
    <>
      <NavigationStack component={NavWrapper} />
      <ContextMenu />
      <Toast />
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
        width: '69%',
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

  return (
    <>
      <View
        style={{
          width: '100%',
          height: '100%',
          flexDirection: 'row',
          backgroundColor: colors.bg,
        }}>
        <View
          style={{
            width: '30%',
            height: '100%',
            borderRightColor: colors.nav,
            borderRightWidth: 1,
          }}>
          <NavigatorStack />
        </View>

        <View
          ref={editorRef}
          style={{
            width: '69%',
            height: '100%',
            backgroundColor: 'transparent',
            paddingRight: 12,
          }}>
          <Editor noMenu={fullscreen ? false : true} />
        </View>
      </View>
      <DialogManager colors={colors} />
    </>
  );
};
