import {EV, EVENTS} from 'notes-core/common';
import React, {useEffect, useRef} from 'react';
import {
  BackHandler,
  InteractionManager,
  Keyboard,
  Platform,
  Vibration,
  View
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {notesnook} from '../../../e2e/test.ids';
import {ActionIcon} from '../../components/ActionIcon';
import {ActionSheetEvent} from '../../components/DialogManager/recievers';
import { Properties } from '../../components/Properties';
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
import {editing, SUBSCRIPTION_STATUS} from '../../utils';
import {db} from '../../utils/database';
import {
  eClearEditor,
  eCloseFullscreenEditor,
  eOnLoadNote,
  eOpenFullscreenEditor,
  eOpenLoginDialog,
  eOpenPremiumDialog,
  eOpenPublishNoteDialog
} from '../../utils/Events';
import {tabBarRef} from '../../utils/Refs';
import {sleep} from '../../utils/TimeUtils';
import {EditorTitle} from './EditorTitle';
import {
  clearEditor,
  clearTimer,
  EditorWebView,
  getNote,
  loadNote,
  setColors,
  startClosingSession
} from './Functions';
import {ProgressCircle} from './ProgressCircle';
import tiny, {safeKeyboardDismiss} from './tiny/tiny';
import {endSearch} from './tiny/toolbar/commands';
import {toolbarRef} from './tiny/toolbar/constants';
import picker from './tiny/toolbar/picker';
import {useEditorTags} from './useEditorTags';

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
  const keyboardListener = useRef();
  const closing = useRef(false);
  const editorTags = useEditorTags();
  const searchReplace = useEditorStore(state => state.searchReplace);

  useEffect(() => {
    setColors(colors);
  }, [colors]);

  const _onBackPress = async () => {
    editing.lastClosedTime = Date.now();
    if (deviceMode === 'mobile') {
      startClosingSession();
    }
    setTimeout(async () => {
      closing.current = true;
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
      editing.focusType = null;
      safeKeyboardDismiss();
      if (deviceMode !== 'mobile') {
        if (fullscreen) {
          eSendEvent(eCloseFullscreenEditor);
        }
      } else {
        startClosingSession();
        if (deviceMode === 'mobile') {
          tabBarRef.current?.goToPage(0);
        }
        eSendEvent('historyEvent', {
          undo: 0,
          redo: 0
        });
        setTimeout(() => {
          useEditorStore.getState().setCurrentlyEditingNote(null);
        }, 1);
        keyboardListener.current?.remove();
        await clearEditor(true, true, true);
      }
      closing.current = false;
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

    let note = getNote() && db.notes.note(getNote().id).data;
    if (note.locked) {
      ToastEvent.show({
        heading: 'Locked notes cannot be published',
        type: 'error',
        context: 'global'
      });
      return;
    }
    if (editing.isFocused) {
      safeKeyboardDismiss();
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

  const onNoteRemoved = async id => {
    try {
      return;
      // console.log('NOTE REMOVED', id);
      // await db.notes.remove(id);
      // if (id !== getNote().id) return;
      // Navigation.setRoutesToUpdate([
      //   Navigation.routeNames.Favorites,
      //   Navigation.routeNames.Notes,
      //   Navigation.routeNames.NotesPage,
      //   Navigation.routeNames.Trash,
      //   Navigation.routeNames.Notebook
      // ]);
    } catch (e) {}
  };

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
    console.log(item.id);
    await loadNote(item);
    InteractionManager.runAfterInteractions(() => {
      keyboardListener.current = Keyboard.addListener(
        'keyboardDidShow',
        tiny.onKeyboardShow
      );
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
          width: '100%',
          position: 'relative',
          backgroundColor: colors.bg,
          right: 0,
          marginTop: Platform.OS === 'ios' ? 0 : insets.top,
          zIndex: 10
        }}>
        <View
          style={{
            flexDirection: 'row',
            paddingHorizontal: 12,
            width: '100%',
            height: 50,
            justifyContent: 'space-between',
            alignItems: 'center'
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
            {fullscreen ? <View style={{width: 20}} /> : null}
            {deviceMode !== 'mobile' ? <EditorTitle /> : null}
          </View>

          <View
            style={{
              flexDirection: 'row'
            }}>
            <>
              {!user ||
              user?.subscription.type === SUBSCRIPTION_STATUS.BASIC ||
              user?.subscription.type === SUBSCRIPTION_STATUS.TRIAL ? (
                <ActionIcon
                  name="crown"
                  color={colors.yellow}
                  customStyle={{
                    marginLeft: 5
                  }}
                  top={50}
                  onPress={async () => {
                    if (editing.isFocused) {
                      safeKeyboardDismiss();
                      editing.isFocused = true;
                    }
                    eSendEvent(eOpenPremiumDialog);
                  }}
                />
              ) : null}
              <ActionIcon
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

              {currentlyEditingNote && (
                <ActionIcon
                  name="cloud-upload-outline"
                  color={colors.pri}
                  customStyle={{
                    marginLeft: 5
                  }}
                  top={50}
                  onPress={publishNote}
                />
              )}

              <ActionIcon
                name="attachment"
                color={colors.pri}
                customStyle={{
                  marginLeft: 5
                }}
                top={50}
                onPress={picker.pick}
              />

              {deviceMode !== 'mobile' && !fullscreen ? (
                <ActionIcon
                  name="fullscreen"
                  color={colors.pri}
                  customStyle={{
                    marginLeft: 5
                  }}
                  top={50}
                  onPress={() => {
                    eSendEvent(eOpenFullscreenEditor);
                    editing.isFullscreen = true;
                  }}
                />
              ) : null}

              <ActionIcon
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
      </View>
    </>
  );
};

export default EditorHeader;
