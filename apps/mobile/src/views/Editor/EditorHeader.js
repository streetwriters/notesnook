import React, { useEffect } from 'react';
import { Keyboard, Platform, View } from 'react-native';
import RNExitApp from 'react-native-exit-app';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { notesnook } from '../../../e2e/test.ids';
import { ActionIcon } from '../../components/ActionIcon';
import { ActionSheetEvent } from '../../components/DialogManager/recievers';
import { useTracked } from '../../provider';
import { DDS } from '../../services/DeviceDetection';
import { eSendEvent, ToastEvent } from '../../services/EventManager';
import Navigation from '../../services/Navigation';
import { editing } from '../../utils';
import { db } from '../../utils/DB';
import {
  eCloseFullscreenEditor,
  eOpenFullscreenEditor
} from '../../utils/Events';
import { sideMenuRef, tabBarRef } from '../../utils/Refs';
import { EditorTitle } from './EditorTitle';
import {
  checkNote,
  clearEditor,
  EditorWebView,
  getNote,
  isNotedEdited,
  loadNote,
  post,
  saveNote,
  setColors,
  setIntent
} from './Functions';
import HistoryComponent from './HistoryComponent';

let handleBack;
let tapCount = 0;

const EditorHeader = () => {
  const [state] = useTracked();
  const {colors, fullscreen, deviceMode,premiumUser} = state;
  const insets = useSafeAreaInsets();

  useEffect(() => {
    setColors(colors);
  }, [colors.bg]);

  useEffect(() => {
    post('tablet', DDS.isLargeTablet());
  }, [deviceMode]);

  useEffect(() => {
    console.log(premiumUser,"PREMIUM USER EDITOR")
    EditorWebView.current?.reload();
  }, [premiumUser]);

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

  return (
    <>
      <View
        style={{
          flexDirection: 'row',
          width: '100%',
          height: 50,
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingHorizontal: 12,
          position: 'relative',
          backgroundColor: colors.bg,
          right: 0,
          marginTop: Platform.OS === 'ios' ? 0 : insets.top,
          zIndex: 10,
        }}>
        {DDS.isLargeTablet() && !fullscreen ? null : (
          <ActionIcon
            onLongPress={async () => {
              await _onBackPress();
              Navigation.popToTop();
            }}
            testID={notesnook.ids.default.header.buttons.back}
            name="arrow-left"
            color={colors.heading}
            onPress={_onBackPress}
            bottom={5}
            customStyle={{
              marginLeft: -5,
            }}
          />
        )}

        {DDS.isLargeTablet() && <EditorTitle />}

        <View
          style={{
            flexDirection: 'row',
          }}>
          <ActionIcon
            name="plus"
            color={colors.accent}
            customStyle={{
              marginLeft: 10,
              borderRadius: 5,
            }}
            onPress={async () => {
              await loadNote({type: 'new'});
            }}
          />

          {DDS.isLargeTablet() && !fullscreen ? (
            <ActionIcon
              name="fullscreen"
              color={colors.heading}
              customStyle={{
                marginLeft: 10,
              }}
              onPress={() => {
                eSendEvent(eOpenFullscreenEditor);
                editing.isFullscreen = true;
              }}
            />
          ) : null}

          <HistoryComponent />

          <ActionIcon
            name="dots-horizontal"
            color={colors.heading}
            customStyle={{
              marginLeft: 10,
            }}
            onPress={() => {
              let note = getNote() && db.notes.note(getNote().id).data;
              ActionSheetEvent(
                note,
                true,
                true,
                ['Add to', 'Share', 'Export', 'Delete'],
                ['Dark Mode', 'Add to Vault', 'Pin', 'Favorite'],
              );
            }}
          />
        </View>
      </View>
    </>
  );
};

export default EditorHeader;
