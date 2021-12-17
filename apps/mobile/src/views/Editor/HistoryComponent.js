import React, {useEffect, useState} from 'react';
import {View} from 'react-native';
import {ActionIcon} from '../../components/ActionIcon';
import {useTracked} from '../../provider';
import {eSubscribeEvent, eUnSubscribeEvent} from '../../services/EventManager';
import {SIZE} from '../../utils/SizeUtils';
import {EditorWebView, post} from './Functions';
import tiny from './tiny/tiny';

const HistoryComponent = () => {
  const [state] = useTracked();
  const {colors} = state;
  const [historyState, setHistoryState] = useState({
    undo: false,
    redo: false
  });

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
      }}>
      <ActionIcon
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
      <ActionIcon
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
