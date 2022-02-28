import React, { useEffect, useState } from 'react';
import { Platform, View } from 'react-native';
import { IconButton } from '../../components/ui/icon-button';
import { useThemeStore } from '../../stores/theme';
import { eSubscribeEvent, eUnSubscribeEvent } from '../../services/event-manager';
import { editing } from '../../utils';
import { SIZE } from '../../utils/size';
import useKeyboard from '../../utils/hooks/use-keyboard';
import { EditorWebView } from './Functions';
import tiny, { safeKeyboardDismiss } from './tiny/tiny';

const HistoryComponent = () => {
  const colors = useThemeStore(state => state.colors);
  const [historyState, setHistoryState] = useState({
    undo: false,
    redo: false
  });
  const keyboard = useKeyboard();
  editing.keyboardState = keyboard.keyboardShown;

  const onHistoryChange = data => {
    setHistoryState(data);
  };

  useEffect(() => {
    eSubscribeEvent('historyEvent', onHistoryChange);
    return () => {
      eUnSubscribeEvent('historyEvent', onHistoryChange);
    };
  }, []);

  return (
    <View
      style={{
        flexDirection: 'row',
        height: 40,
        marginRight: 5
      }}
    >
      {Platform.OS === 'ios' && keyboard.keyboardShown ? (
        <IconButton
          name="keyboard-close"
          color={colors.pri}
          size={SIZE.lg}
          customStyle={{
            width: 35,
            height: 35
          }}
          onPress={() => {
            editing.keyboardState = true;
            safeKeyboardDismiss();
          }}
        />
      ) : null}

      <IconButton
        name="undo-variant"
        disabled={!historyState.undo}
        color={colors.pri}
        size={SIZE.xl}
        customStyle={{
          width: 35,
          height: 35
        }}
        onPress={() => {
          if (!historyState.undo) return;
          tiny.call(EditorWebView, tiny.undo);
        }}
      />
      <IconButton
        name="redo-variant"
        disabled={!historyState.redo}
        color={colors.pri}
        size={SIZE.xl}
        customStyle={{
          width: 35,
          height: 35
        }}
        onPress={() => {
          if (!historyState.redo) return;
          tiny.call(EditorWebView, tiny.redo);
        }}
      />
    </View>
  );
};

export default HistoryComponent;
