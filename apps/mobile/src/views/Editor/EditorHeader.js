import React, {useEffect, useState} from 'react';
import {BackHandler, Keyboard, Platform, StatusBar, View} from 'react-native';
import {ActionIcon} from '../../components/ActionIcon';
import {
  ActionSheetEvent,
  simpleDialogEvent,
} from '../../components/DialogManager/recievers';
import {
  TEMPLATE_EXIT_FULLSCREEN,
} from '../../components/DialogManager/Templates';
import {useTracked} from '../../provider';
import {DDS} from '../../services/DeviceDetection';
import {
  eSendEvent,
  eSubscribeEvent,
  eUnSubscribeEvent,
  ToastEvent,
} from '../../services/EventManager';
import {editing} from '../../utils';
import {exitEditorAnimation} from '../../utils/Animations';
import {
  eClearEditor,
  eCloseFullscreenEditor,
  eOnLoadNote,
  eOpenFullscreenEditor,
} from '../../utils/Events';
import {tabBarRef} from '../../utils/Refs';
import {normalize} from '../../utils/SizeUtils';
import {
  checkNote,
  clearEditor,
  clearTimer,
  EditorWebView,
  getNote,
  isNotedEdited,
  loadNote,
  post,
  setColors,
  textInput,
} from './Functions';
import HistoryComponent from './HistoryComponent';

let handleBack;
let tapCount = 0;

const EditorHeader = ({noMenu}) => {
  const [state] = useTracked();
  const {colors, premiumUser} = state;
  const [fullscreen, setFullscreen] = useState(false);

  useEffect(() => {
    setColors(colors);
    let c = {...colors};
    c.factor = normalize(1);
    post('theme', colors);
  }, [colors.bg]);

  useEffect(() => {
    if (!DDS.isTab) return;
    if (noMenu) {
      post('nomenu', true);
    } else {
      post('nomenu', false);
    }
  }, [noMenu]);

  useEffect(() => {
    eSubscribeEvent(eOnLoadNote, load);
    eSubscribeEvent(eCloseFullscreenEditor, closeFullscreen);
    eSubscribeEvent(eClearEditor, onCallClear);

    return () => {
      eUnSubscribeEvent(eClearEditor, onCallClear);
      eUnSubscribeEvent(eCloseFullscreenEditor, closeFullscreen);
      eUnSubscribeEvent(eOnLoadNote, load);
    };
  }, []);

  useEffect(() => {
    if (!noMenu && DDS.isTab) {
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
  }, [noMenu]);

  const load = async (item) => {
    await loadNote(item);
    Keyboard.addListener('keyboardDidShow', () => {
      post('keyboard');
    });
    if (!DDS.isTab) {
      handleBack = BackHandler.addEventListener(
        'hardwareBackPress',
        _onHardwareBackPress,
      );
    }
  };

  const onCallClear = async () => {
    if (editing.currentlyEditing) {
      exitEditorAnimation();
    }
    await clearEditor();
  };
  const closeFullscreen = () => {
    setFullscreen(false);
  };

  useEffect(() => {
    EditorWebView.current?.reload();
  }, [premiumUser]);

  const _onHardwareBackPress = async () => {
    if (editing.currentlyEditing) {
      await _onBackPress();
      return true;
      /* 
      if (tapCount > 0) {
    
      } else {
        tapCount = 1;
        setTimeout(() => {
          tapCount = 0;
        }, 3000);
        ToastEvent.show('Press back again to exit editor', 'success');
        return true;
      } */
    }
  };

  const _onBackPress = async () => {
    editing.currentlyEditing = false;
    if (DDS.isTab && !DDS.isSmallTab) {
      if (fullscreen) {
        eSendEvent(eCloseFullscreenEditor);
      }
    } else {
      /*  exitEditorAnimation(); */
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
      {noMenu || DDS.isPhone || DDS.isSmallTab ? (
        <View />
      ) : (
        <ActionIcon
          name="arrow-left"
          color={colors.heading}
          onPress={_onBackPress}
          bottom={5}
          iconStyle={{
            textAlignVertical: 'center',
          }}
          customStyle={{
            marginLeft: -5,
            position: 'absolute',
            marginTop: Platform.OS === 'ios' ? 0 : StatusBar.currentHeight + 5,
            zIndex: 11,
            left: 0,
            justifyContent: 'center',
            alignItems: 'center',
          }}
        />
      )}

      <View
        style={{
          flexDirection: 'row',
          width: DDS.isTab && !DDS.isSmallTab ? '30%' : '100%',
          height: 50,
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingHorizontal: 12,
          position: DDS.isTab && !DDS.isSmallTab ? 'absolute' : 'relative',
          backgroundColor: colors.bg,
          right: 0,
          marginTop: Platform.OS === 'ios' ? 0 : StatusBar.currentHeight,
          zIndex: 10,
        }}>
        {DDS.isTab && !DDS.isSmallTab ? (
          <View />
        ) : (
          <ActionIcon
            name="arrow-left"
            color={colors.heading}
            onPress={_onBackPress}
            bottom={5}
            customStyle={{
              marginLeft: -5,
            }}
          />
        )}

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

          {DDS.isTab && !DDS.isSmallTab && !fullscreen ? (
            <ActionIcon
              name="fullscreen"
              color={colors.heading}
              customStyle={{
                marginLeft: 10,
              }}
              onPress={() => {
                eSendEvent(eOpenFullscreenEditor);
                setFullscreen(true);
                editing.isFullscreen = true;
                post(
                  JSON.stringify({
                    type: 'nomenu',
                    value: false,
                  }),
                );
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
              ActionSheetEvent(
                getNote(),
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
