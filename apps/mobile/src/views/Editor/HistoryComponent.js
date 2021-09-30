import React, {useEffect, useState} from 'react';
import {ActionIcon} from '../../components/ActionIcon';
import {useTracked} from '../../provider';
import {eSubscribeEvent, eUnSubscribeEvent} from '../../services/EventManager';
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
    <>
      <ActionIcon
        name="undo-variant"
        disabled={!historyState.undo}
        color={colors.pri}
        customStyle={{
          marginLeft: 10
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
        onPress={() => {
          if (!historyState.redo) return;
          tiny.call(EditorWebView, tiny.redo);
        }}
      />
    </>
  );
};

export default HistoryComponent;
