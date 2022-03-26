import { EV, EVENTS } from 'notes-core/common';
import React, { useEffect, useRef } from 'react';
import { BackHandler, InteractionManager, Platform, Vibration, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { notesnook } from '../../../e2e/test.ids';
import { Properties } from '../../components/properties';
import { IconButton } from '../../components/ui/icon-button';
import { DDS } from '../../services/device-detection';
import {
  eSendEvent,
  eSubscribeEvent,
  eUnSubscribeEvent,
  ToastEvent
} from '../../services/event-manager';
import Navigation from '../../services/navigation';
import { useEditorStore, useSettingStore, useUserStore } from '../../stores/stores';
import { useThemeStore } from '../../stores/theme';
import umami from '../../utils/analytics';
import { SUBSCRIPTION_STATUS } from '../../utils/constants';
import { db } from '../../utils/database';
import {
  eClearEditor,
  eCloseFullscreenEditor,
  eOnLoadNote,
  eOpenFullscreenEditor,
  eOpenLoginDialog,
  eOpenPremiumDialog,
  eOpenPublishNoteDialog
} from '../../utils/events';
import { tabBarRef } from '../../utils/global-refs';
import { EditorTitle } from './EditorTitle';
import { ProgressCircle } from './ProgressCircle';
import { safeKeyboardDismiss } from './tiny/tiny';
import { endSearch } from './tiny/toolbar/commands';
import picker from './tiny/toolbar/picker';
import { editorController, editorState } from './tiptap/utils';

const EditorHeader = ({ editor }) => {
  const colors = useThemeStore(state => state.colors);
  const deviceMode = useSettingStore(state => state.deviceMode);
  const currentlyEditingNote = useEditorStore(state => state.currentEditingNote);
  const fullscreen = useSettingStore(state => state.fullscreen);
  const user = useUserStore(state => state.user);
  const insets = useSafeAreaInsets();
  const handleBack = useRef();
  const keyboardListener = useRef();
  const closing = useRef(false);
  //const editorTags = useEditorTags();
  const searchReplace = useEditorStore(state => state.searchReplace);
  const readonly = useEditorStore(state => state.readonly);

  const _onBackPress = async () => {
    setTimeout(async () => {
      if (deviceMode !== 'mobile' && fullscreen) {
        if (fullscreen) {
          eSendEvent(eCloseFullscreenEditor);
        }
        return;
      }

      if (deviceMode === 'mobile') {
        editorState().movedAway = true;
        tabBarRef.current?.goToPage(0);
      }
      eSendEvent('historyEvent', {
        undo: 0,
        redo: 0
      });
      setImmediate(() => useEditorStore.getState().setCurrentlyEditingNote(null));
      editorState().currentlyEditing = false;
      keyboardListener.current?.remove();
      editor?.reset();
      Navigation.setRoutesToUpdate([
        Navigation.routeNames.NotesPage,
        Navigation.routeNames.Favorites,
        Navigation.routeNames.Notes,
        Navigation.routeNames.Notebook
      ]);
    }, 1);
  };

  const publishNote = async () => {
    if (!user) {
      ToastEvent.show({
        heading: 'Login required',
        message: 'Login to publish',
        context: 'global',
        func: () => {
          eSendEvent(eOpenLoginDialog);
        },
        actionText: 'Login'
      });
      return;
    }

    if (!user.isEmailConfirmed) {
      ToastEvent.show({
        heading: 'Email not verified',
        message: 'Please verify your email first.',
        context: 'global'
      });
      return;
    }

    let note = db.notes.note(editorController.current?.note?.id)?.data;
    if (note.locked) {
      ToastEvent.show({
        heading: 'Locked notes cannot be published',
        type: 'error',
        context: 'global'
      });
      return;
    }
    if (editorState().isFocused) {
      safeKeyboardDismiss();
      editorState().isFocused = true;
    }
    eSendEvent(eOpenPublishNoteDialog, note);
  };

  const showActionsheet = async () => {
    let note = db.notes.note(editorController.current?.note?.id)?.data;

    if (!note) {
      ToastEvent.show({
        heading: 'Start writing to create a new note',
        type: 'success',
        context: 'global'
      });

      return;
    }

    if (editorState().isFocused || editorState().keyboardState) {
      safeKeyboardDismiss();
      editorState().isFocused = true;
    }

    Properties.present(note, ['Dark Mode']);
  };

  useEffect(() => {
    eSubscribeEvent(eOnLoadNote, load);
    eSubscribeEvent(eClearEditor, onCallClear);
    EV.subscribe(EVENTS.noteRemoved, onNoteRemoved);
    return () => {
      EV.unsubscribe(EVENTS.noteRemoved, onNoteRemoved);
      eUnSubscribeEvent(eClearEditor, onCallClear);
      eUnSubscribeEvent(eOnLoadNote, load);
    };
  }, []);

  const onNoteRemoved = async id => {};

  useEffect(() => {
    if (fullscreen && DDS.isTab) {
      handleBack.current = BackHandler.addEventListener('hardwareBackPress', _onBackPress);
    }

    return () => {
      if (handleBack.current) {
        handleBack.current.remove();
        handleBack.current = null;
      }
    };
  }, [fullscreen]);

  const load = async item => {
    //console.log(item.id);
    // await loadNote(item);
    console.log('load called');
    InteractionManager.runAfterInteractions(() => {
      //keyboardListener.current = Keyboard.addListener('keyboardDidShow', tiny.onKeyboardShow);
      if (!DDS.isTab) {
        handleBack.current = BackHandler.addEventListener(
          'hardwareBackPress',
          _onHardwareBackPress
        );
      }
    });
  };

  const onCallClear = async value => {
    if (value === 'removeHandler') {
      if (handleBack.current) {
        handleBack.current.remove();
        handleBack.current = null;
      }
      return;
    }
    if (value === 'addHandler') {
      if (handleBack.current) {
        handleBack.current.remove();
        handleBack.current = null;
      }

      handleBack.current = BackHandler.addEventListener('hardwareBackPress', _onHardwareBackPress);
      return;
    }
    if (editorState().currentlyEditing) {
      await _onBackPress();
    }
  };

  const _onHardwareBackPress = async () => {
    if (editorState().currentlyEditing) {
      await _onBackPress();
      return true;
    }
  };

  return (
    <>
      <View
        style={{
          width: '100%',
          backgroundColor: colors.bg,
          marginTop: Platform.OS === 'ios' ? 0 : insets.top,
          flexDirection: 'row',
          paddingHorizontal: 12,
          height: 50,
          justifyContent: 'space-between'
        }}
      >
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            flexGrow: 1,
            flexShrink: 1
          }}
        >
          {deviceMode !== 'mobile' && !fullscreen ? null : (
            <IconButton
              onLongPress={async () => {
                await _onBackPress();
                Navigation.popToTop();
              }}
              top={50}
              left={12}
              testID={notesnook.editor.back}
              name="arrow-left"
              color={colors.pri}
              onPress={_onBackPress}
              bottom={5}
              customStyle={{
                marginLeft: -5
              }}
            />
          )}
          {fullscreen ? <View style={{ width: 20 }} /> : null}
          {deviceMode !== 'mobile' ? <EditorTitle /> : null}
        </View>

        <View
          style={{
            flexDirection: 'row'
          }}
        >
          <>
            {!user ||
            user?.subscription.type === SUBSCRIPTION_STATUS.BASIC ||
            user?.subscription.type === SUBSCRIPTION_STATUS.TRIAL ? (
              <IconButton
                name="crown"
                color={colors.yellow}
                customStyle={{
                  marginLeft: 5
                }}
                top={50}
                onPress={async () => {
                  if (editorState().isFocused) {
                    safeKeyboardDismiss();
                    editorState().isFocused = true;
                  }
                  umami.pageView('/pro-screen', '/editor');
                  eSendEvent(eOpenPremiumDialog);
                }}
              />
            ) : null}
            <IconButton
              name="magnify"
              color={searchReplace ? colors.accent : colors.pri}
              customStyle={{
                marginLeft: 5
              }}
              type={searchReplace ? 'grayBg' : 'transparent'}
              top={50}
              buttom={10}
              onLongPress={() => {
                if (searchReplace) {
                  endSearch();
                  Vibration.vibrate(5, false);
                }
              }}
              onPress={() => {
                useEditorStore.getState().setSearchReplace(true);
              }}
            />

            {currentlyEditingNote && !readonly && (
              <IconButton
                name="cloud-upload-outline"
                color={colors.pri}
                customStyle={{
                  marginLeft: 5
                }}
                top={50}
                onPress={publishNote}
              />
            )}

            {!readonly && (
              <IconButton
                name="attachment"
                color={colors.pri}
                customStyle={{
                  marginLeft: 5
                }}
                top={50}
                onPress={picker.pick}
              />
            )}

            {deviceMode !== 'mobile' && !fullscreen ? (
              <IconButton
                name="fullscreen"
                color={colors.pri}
                customStyle={{
                  marginLeft: 5
                }}
                top={50}
                onPress={() => {
                  eSendEvent(eOpenFullscreenEditor);
                  editorState().isFullscreen = true;
                }}
              />
            ) : null}

            <IconButton
              name="dots-horizontal"
              color={colors.pri}
              customStyle={{
                marginLeft: 5
              }}
              top={50}
              right={50}
              onPress={showActionsheet}
            />

            <ProgressCircle />
          </>
        </View>
      </View>
    </>
  );
};

export default EditorHeader;
