import React, {useEffect, useRef} from 'react';
import {
  BackHandler,
  InteractionManager,
  Keyboard,
  Platform,
  View
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {notesnook} from '../../../e2e/test.ids';
import {ActionIcon} from '../../components/ActionIcon';
import {ActionSheetEvent} from '../../components/DialogManager/recievers';
import {useTracked} from '../../provider';
import {
  useEditorStore,
  useSettingStore,
  useUserStore
} from '../../provider/stores';
import {DDS} from '../../services/DeviceDetection';
import {
  eSendEvent,
  eSubscribeEvent,
  eUnSubscribeEvent,
  ToastEvent
} from '../../services/EventManager';
import Navigation from '../../services/Navigation';
import {editing} from '../../utils';
import {db} from '../../utils/DB';
import {
  eClearEditor,
  eCloseFullscreenEditor,
  eOnLoadNote,
  eOpenFullscreenEditor,
  eOpenPublishNoteDialog,
  eOpenLoginDialog
} from '../../utils/Events';
import {tabBarRef} from '../../utils/Refs';
import {sleep} from '../../utils/TimeUtils';
import {EditorTitle} from './EditorTitle';
import {
  checkNote,
  clearEditor,
  clearTimer,
  EditorWebView,
  getNote,
  isNotedEdited,
  loadNote,
  presentResolveConflictDialog,
  setColors,
  textInput
} from './Functions';
import HistoryComponent from './HistoryComponent';
import tiny, {safeKeyboardDismiss} from './tiny/tiny';
import {toolbarRef} from './tiny/toolbar/constants';

const EditorHeader = () => {
  const [state] = useTracked();
  const {colors} = state;
  const deviceMode = useSettingStore(state => state.deviceMode);
  const currentlyEditingNote = useEditorStore(
    state => state.currentEditingNote
  );
  const fullscreen = useSettingStore(state => state.fullscreen);
  const user = useUserStore(state => state.user);
  const insets = useSafeAreaInsets();
  const handleBack = useRef();

  useEffect(() => {
    setColors(colors);
  }, [colors]);

  const _onBackPress = async () => {
    if (deviceMode !== 'mobile' && fullscreen) {
      eSendEvent(eCloseFullscreenEditor);
      return;
    }
    if (deviceMode === 'mobile') {
      editing.movedAway = true;
    }
    eSendEvent('showTooltip');
    toolbarRef.current?.scrollTo({
      x: 0,
      y: 0,
      animated: false
    });
    editing.isFocused = false;
    editing.currentlyEditing = false;
    if (deviceMode !== 'mobile') {
      if (fullscreen) {
        eSendEvent(eCloseFullscreenEditor);
      }
    } else {
      if (deviceMode === 'mobile') {
        tabBarRef.current?.goToPage(0);
      }
      eSendEvent('historyEvent', {
        undo: 0,
        redo: 0
      });
      if (checkNote() && isNotedEdited()) {
        ToastEvent.show({
          heading: 'Note Saved',
          type: 'success',
          duration: 1500
        });
      }
      useEditorStore.getState().setCurrentlyEditingNote(null);
      await clearTimer(true);
      await clearEditor(false,true,false);
      Keyboard.removeListener('keyboardDidShow', tiny.onKeyboardShow);
    }
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

    let note = getNote() && db.notes.note(getNote().id).data;
    if (note.locked) {
      ToastEvent.show({
        heading: 'Locked notes cannot be published',
        type: 'error',
        context: 'global'
      });
      return;
    }
    console.log(editing.isFocused);
    if (editing.isFocused) {
      safeKeyboardDismiss();
      await sleep(300);
      editing.isFocused = true;
    }
    eSendEvent(eOpenPublishNoteDialog, note);
  };

  const showActionsheet = async () => {
    let note = getNote() && db.notes.note(getNote().id).data;
    if (editing.isFocused || editing.keyboardState) {
      safeKeyboardDismiss();
      editing.isFocused = true;
    }
    await sleep(500);
    let android = Platform.OS === 'android' ? ['PinToNotif'] : [];
    ActionSheetEvent(note, true, true, [
      'Add to notebook',
      'Share',
      'Export',
      'Delete',
      'Copy',
      'Dark Mode',
      'Add to Vault',
      'Pin',
      'Favorite',
      'Publish',
      ...android
    ]);
  };

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
      handleBack.current = BackHandler.addEventListener(
        'hardwareBackPress',
        _onBackPress
      );
    }

    return () => {
      clearTimer();
      if (handleBack.current) {
        handleBack.current.remove();
        handleBack.current = null;
      }
    };
  }, [fullscreen]);

  const load = async item => {
    await loadNote(item);
    InteractionManager.runAfterInteractions(() => {
      Keyboard.addListener('keyboardDidShow', tiny.onKeyboardShow);
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

      handleBack.current = BackHandler.addEventListener(
        'hardwareBackPress',
        _onHardwareBackPress
      );
      return;
    }
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
          zIndex: 10
        }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center'
          }}>
          {deviceMode !== 'mobile' && !fullscreen ? null : (
            <ActionIcon
              onLongPress={async () => {
                await _onBackPress();
                Navigation.popToTop();
              }}
              top={50}
              left={50}
              testID={notesnook.ids.default.header.buttons.back}
              name="arrow-left"
              color={colors.heading}
              onPress={_onBackPress}
              bottom={5}
              customStyle={{
                marginLeft: -5
              }}
            />
          )}
          {fullscreen && <View style={{width: 20}} />}
          {deviceMode !== 'mobile' && <EditorTitle />}
        </View>
        <View
          style={{
            flexDirection: 'row'
          }}>
          <>
            {currentlyEditingNote && (
              <ActionIcon
                name="cloud-upload-outline"
                color={colors.accent}
                customStyle={{
                  marginLeft: 10,
                  borderRadius: 5
                }}
                top={50}
                onPress={publishNote}
              />
            )}

            {deviceMode !== 'mobile' && !fullscreen ? (
              <ActionIcon
                name="fullscreen"
                color={colors.heading}
                customStyle={{
                  marginLeft: 10
                }}
                top={50}
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
                marginLeft: 10
              }}
              top={50}
              right={50}
              onPress={showActionsheet}
            />
          </>
        </View>
      </View>
    </>
  );
};

export default EditorHeader;
