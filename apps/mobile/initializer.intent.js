import React from 'react';
import {DialogManager} from './src/components/DialogManager';
import {DummyText} from './src/components/DummyText';
import {Toast} from './src/components/Toast';
import {useTracked} from './src/provider';
import {EditorWrapper} from './src/views/Editor/EditorWrapper';

export const IntentView = () => {
  const [state] = useTracked();
  const {colors} = state;

  return (
    <>
      <EditorWrapper
        dimensions={{
          width: '100%',
          height: '100%',
        }}
      />
      <Toast />
      <DummyText />
      <DialogManager colors={colors} />
    </>
  );
};
