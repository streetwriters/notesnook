import React, {useEffect} from 'react';
import {BackHandler, InteractionManager, Keyboard} from 'react-native';
import RNExitApp from 'react-native-exit-app';
import {simpleDialogEvent} from '../../components/DialogManager/recievers';
import {TEMPLATE_EXIT_FULLSCREEN} from '../../components/DialogManager/Templates';
import { useTracked } from '../../provider';
import {DDS} from '../../services/DeviceDetection';
import {
  eSendEvent,
  eSubscribeEvent,
  eUnSubscribeEvent,
  ToastEvent,
} from '../../services/EventManager';
import {editing} from '../../utils';
import {
  eClearEditor,
  eCloseFullscreenEditor,
  eOnLoadNote,
} from '../../utils/Events';
import {sideMenuRef, tabBarRef} from '../../utils/Refs';
import {
  checkNote,
  clearEditor,
  clearTimer,
  isNotedEdited,
  loadNote,
  post,
  saveNote,
  setIntent,
} from './Functions';

let handleBack;
let tapCount = 0;

const EditorRoot = () => {
  const [state] = useTracked();
  const {fullscreen} = state;
  useEffect(() => {
    eSubscribeEvent(eOnLoadNote, load);
    eSubscribeEvent(eClearEditor, onCallClear);
    return () => {
      eUnSubscribeEvent(eClearEditor, onCallClear);
      eUnSubscribeEvent(eOnLoadNote, load);
    };
  }, []);

  useEffect(() => {
    if (fullscreen && DDS.isTab) {
      handleBack = BackHandler.addEventListener('hardwareBackPress', () => {
        simpleDialogEvent(TEMPLATE_EXIT_FULLSCREEN());
        editing.isFullscreen = false;
        return true;
      });
    }

    return () => {
      clearTimer();
      if (handleBack) {
        handleBack.remove();
        handleBack = null;
      }
    };
  }, [fullscreen]);

  const load = async (item) => {
    await loadNote(item);
    InteractionManager.runAfterInteractions(() => {
      Keyboard.addListener('keyboardDidShow', () => {
        editing.isFocused = true;
        post('keyboard');
      });
      if (!DDS.isTab) {
        handleBack = BackHandler.addEventListener(
          'hardwareBackPress',
          _onHardwareBackPress,
        );
      }
    });
  };

  const onCallClear = async () => {
    if (editing.currentlyEditing) {
      await _onBackPress();
    }
  };

  const _onHardwareBackPress = async () => {
    if (editing.currentlyEditing) {
      await _onBackPress();
      return true;
    }
  };

  const _onBackPress = async () => {
    if (sideMenuRef.current === null) {
      if (tapCount > 0) {
        tapCount = 0;
        setIntent(false);
        editing.currentlyEditing = false;
        await clearEditor();
        RNExitApp.exitApp();
      } else {
        await saveNote();
        tapCount = 1;
        setTimeout(() => {
          tapCount = 0;
        }, 3000);
        ToastEvent.show('Note saved, press back again to exit app.', 'success');
      }
      return true;
    }
    editing.currentlyEditing = false;
    if (DDS.isLargeTablet()) {
      if (fullscreen) {
        eSendEvent(eCloseFullscreenEditor);
      }
    } else {
      if (DDS.isPhone || DDS.isSmallTab) {
        tabBarRef.current?.goToPage(0);
      }
      eSendEvent('historyEvent', {
        undo: 0,
        redo: 0,
      });

      if (checkNote() && isNotedEdited()) {
        ToastEvent.show('Note Saved!', 'success');
      }
      await clearEditor();
      Keyboard.removeListener('keyboardDidShow', () => {
        editing.isFocused = true;
        post('keyboard');
      });
      if (handleBack) {
        handleBack.remove();
        handleBack = null;
      }
    }
  };

  return <></>;
};

export default EditorRoot;
