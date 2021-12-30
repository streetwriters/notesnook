import React, {useEffect, useRef, useState} from 'react';
import {TextInput, View} from 'react-native';
import {Button} from '../../../../components/Button';
import {useTracked} from '../../../../provider';
import {eSendEvent, ToastEvent} from '../../../../services/EventManager';
import {editing} from '../../../../utils';
import {normalize, SIZE} from '../../../../utils/SizeUtils';
import {EditorWebView} from '../../Functions';
import tiny from '../tiny';
import {execCommands} from './commands';
import {
  focusEditor,
  formatSelection,
  INPUT_MODE,
  properties
} from './constants';
import LinkPreview from './linkpreview';
import validator from 'validator';
import Input from '../../../../components/Input';

let inputValue = null;

const ToolbarLinkInput = ({format, value, setVisible}) => {
  const [state] = useTracked();
  const {colors} = state;
  const [mode, setMode] = useState(
    value ? INPUT_MODE.NO_EDIT : INPUT_MODE.EDITING
  );

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
      return;
    } else {
      if (properties.pauseSelectionChange) {
        setTimeout(() => {
          properties.pauseSelectionChange = false;
        }, 1000);
      }
    }
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
      if (!inputValue.includes('://')) inputValue = 'https://' + inputValue;
      if (!validator.isURL(inputValue)) {
        ToastEvent.show({
          heading: 'Invalid url',
          message: 'Please enter a valid url',
          type: 'error'
        });
        return;
      }
      console.log('format:',format,'value:',inputValue);
      properties.userBlur = true;
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
      }}>
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
            height={40}
          />
          {/* <TextInput
            ref={inputRef}
            onBlur={onBlur}
            style={{
              height: normalize(40),
              color: colors.pri,
              zIndex: 10,
              flexWrap: 'wrap',
              fontSize: SIZE.sm,
              flexShrink: 1,
              minWidth: '80%',
              fontFamily: 'OpenSans-Regular'
            }}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyLabel="Done"
            returnKeyType="done"
            onSubmitEditing={() => onSubmit(inputValue)}
            onChangeText={onChangeText}
            defaultValue={value}
            blurOnSubmit={false}
            placeholderTextColor={colors.icon}
          /> */}

          {/* {mode === INPUT_MODE.EDITING && (
            <Button
              title="Save"
              onPress={onSubmit}
              height={normalize(40)}
              fontSize={SIZE.sm}
              style={{paddingHorizontal: 6}}
            />
          )} */}
        </>
      )}
    </View>
  );
};

export default ToolbarLinkInput;
