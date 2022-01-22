import React, { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import isEmail from 'validator/lib/isEmail';
import isMobilePhone from 'validator/lib/isMobilePhone';
import isURL from 'validator/lib/isURL';
import { Button } from '../../../../components/Button';
import Input from '../../../../components/Input';
import { useTracked } from '../../../../provider';
import { eSendEvent, ToastEvent } from '../../../../services/EventManager';
import { editing, itemSkus } from '../../../../utils';
import { SIZE } from '../../../../utils/SizeUtils';
import { EditorWebView } from '../../Functions';
import tiny from '../tiny';
import { execCommands } from './commands';
import { focusEditor, formatSelection, INPUT_MODE, properties } from './constants';
import LinkPreview from './linkpreview';

let inputValue = null;

const ToolbarLinkInput = ({ format, value, setVisible }) => {
  const [state] = useTracked();
  const { colors } = state;
  const [mode, setMode] = useState(value ? INPUT_MODE.NO_EDIT : INPUT_MODE.EDITING);

  const inputRef = useRef();

  useEffect(() => {
    if (!value) {
      inputRef.current?.focus();
      tiny.call(EditorWebView, tiny.restoreRange);
    }
    inputValue = value;
    properties.inputMode = value ? INPUT_MODE.NO_EDIT : INPUT_MODE.EDITING;
    editing.tooltip = format;
    properties.userBlur = false;
    return () => {
      properties.inputMode = null;
      editing.tooltip = null;
      inputValue = null;
    };
  }, [format]);

  useEffect(() => {
    if (value && mode === INPUT_MODE.EDITING) {
      if (properties.pauseSelectionChange) {
        setTimeout(() => {
          properties.pauseSelectionChange = false;
        }, 1000);
      }
      inputRef.current?.focus();
    } else {
      if (properties.pauseSelectionChange) {
        setTimeout(() => {
          properties.pauseSelectionChange = false;
        }, 1000);
      }
    }

    return () => {
      tiny.call(EditorWebView, tiny.restoreRange);
      tiny.call(EditorWebView, tiny.clearRange);
    };
  }, [mode]);

  const onChangeText = value => {
    inputValue = value;
  };

  const onSubmit = value => {
    if (value === 'clear') {
      inputValue = null;
    }
    if (inputValue === '' || !inputValue) {
      properties.userBlur = true;
      formatSelection(execCommands.unlink);
      setVisible(false);
    } else {
      if (!isURL(inputValue) && !isEmail(inputValue) && !isMobilePhone(inputValue)) {
        ToastEvent.show({
          heading: 'Invalid url',
          message: 'Please enter a valid url',
          type: 'error'
        });
        return;
      }
      console.log('format:', format, 'value:', inputValue);
      properties.userBlur = true;
      tiny.call(EditorWebView, tiny.restoreRange);
      tiny.call(EditorWebView, tiny.clearRange);
      formatSelection(execCommands[format](inputValue));
    }

    editing.tooltip = null;
    setMode(INPUT_MODE.NO_EDIT);

    focusEditor(format, false);
    properties.userBlur = false;
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
        paddingHorizontal: 6,
        width: '100%'
      }}
    >
      {mode === INPUT_MODE.NO_EDIT ? (
        <LinkPreview value={value} setMode={setMode} onSubmit={onSubmit} />
      ) : (
        <>
          <Input
            fwdRef={inputRef}
            onSubmit={() => onSubmit(inputValue)}
            onChangeText={onChangeText}
            blurOnSubmit={false}
            onBlurInput={onBlur}
            defaultValue={value}
            placeholder="Enter link"
            buttons={
              <>
                {[
                  {
                    text: 'Save',
                    type: 'grayBg',
                    press: () => onSubmit(inputValue)
                  }
                ].map(button => (
                  <Button
                    key={button.text}
                    title={button.text}
                    fontSize={SIZE.xs + 1}
                    height={28}
                    width={null}
                    buttonType={{
                      text: colors.accent
                    }}
                    onPress={button.press}
                    style={{
                      flexDirection: 'row',
                      paddingHorizontal: button.icon ? 6 : 12
                    }}
                    icon={button.icon}
                    type={button.type}
                  />
                ))}
              </>
            }
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyLabel="Done"
            returnKeyType="done"
            fontSize={SIZE.xs + 1}
            height={45}
          />
        </>
      )}
    </View>
  );
};

export default ToolbarLinkInput;
