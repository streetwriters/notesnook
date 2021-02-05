import React, {useEffect, useRef, useState} from 'react';
import {Linking, View} from 'react-native';
import {eSendEvent} from '../../../../services/EventManager';
import {Button} from '../../../../components/Button';
import Input from '../../../../components/Input';
import {useTracked} from '../../../../provider';
import {editing} from '../../../../utils';
import {execCommands} from './commands';
import {focusEditor, formatSelection, INPUT_MODE, properties} from './constants';
import LinkPreview from './linkpreview';
import tiny from '../tiny';
import { EditorWebView } from '../../Functions';

let inputValue = null;

const ToolbarLinkInput = ({format, value, setVisible}) => {
  const [state] = useTracked();
  const {colors} = state;
  const [mode, setMode] = useState(
    value ? INPUT_MODE.NO_EDIT : INPUT_MODE.EDITING,
  );

  const inputRef = useRef();

  useEffect(() => {
    if (!value) {
      inputRef.current?.focus();
      tiny.call(EditorWebView, tiny.restoreRange);
    }
    properties.inputMode = value ? INPUT_MODE.NO_EDIT : INPUT_MODE.EDITING;
    editing.tooltip = format;
    properties.userBlur = false;
    if (properties.pauseSelectionChange) {
      setTimeout(() => {
        properties.pauseSelectionChange = false;
      }, 100);
    }
    return () => {
      properties.inputMode = null;
      editing.tooltip = null;
      inputValue = null;
    };
  }, [format]);

  const onChangeText = (value) => {
    inputValue = value;
  };

  const onSubmit = (value) => {
    if (value === 'clear') {
      inputValue = null;
    }
    properties.userBlur = true;
    if (inputValue === '' || !inputValue) {
      formatSelection(execCommands.unlink);
    } else {
      formatSelection(execCommands[format](inputValue));
    }
    tiny.call(EditorWebView, tiny.restoreRange + tiny.clearRange);

    setVisible(false);
    editing.tooltip = null;
    focusEditor(format);
    properties.userBlur = false;
  };

  const onPress = async () => {
    await Linking.openURL(value);
  };

  const onBlur = async () => {
    tiny.call(EditorWebView, tiny.clearRange);
    formatSelection(`current_selection_range = null`);
    if (properties.userBlur) return;
    focusEditor('custom');
    eSendEvent('showTooltip');
  };

  return (
    <View
      style={{
        flexDirection: 'row',
        paddingHorizontal: 12,
        maxWidth: '100%',
        width: '100%',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
      {mode === INPUT_MODE.NO_EDIT ? (
        <LinkPreview value={value} setMode={setMode} onSubmit={onSubmit} />
      ) : (
        <>
          <Input
            fwdRef={inputRef}
            onBlurInput={onBlur}
            onPress={onPress}
            height={45}
            onSubmit={onSubmit}
            onChangeText={onChangeText}
            defaultValue={value}
            blurOnSubmit={false}
            loading={mode === INPUT_MODE.NO_EDIT}
            placeholder="Enter link"
          />

          {mode === INPUT_MODE.EDITING && (
            <Button
              title="Save"
              onPress={onSubmit}
              height={40}
              fontSize={12}
              style={{marginLeft: 10}}
            />
          )}
        </>
      )}
    </View>
  );
};

export default ToolbarLinkInput;
