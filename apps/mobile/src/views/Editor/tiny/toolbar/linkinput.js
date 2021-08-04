import React, {useEffect, useRef, useState} from 'react';
import {TextInput, View} from 'react-native';
import {Button} from '../../../../components/Button';
import {useTracked} from '../../../../provider';
import {eSendEvent} from '../../../../services/EventManager';
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

  useEffect(() => {
    if (value && mode === INPUT_MODE.EDITING) {
      if (properties.pauseSelectionChange) {
        setTimeout(() => {
          properties.pauseSelectionChange = false;
        }, 100);
      }
      inputRef.current?.focus();
      return;
    }
  }, [mode]);

  const onChangeText = value => {
    inputValue = value;
  };

  const onSubmit = value => {
    if (value === 'clear') {
      inputValue = null;
    }
    properties.userBlur = true;
    if (inputValue === '' || !inputValue) {
      formatSelection(execCommands.unlink);
      setVisible(false);
    } else {
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
        flexDirection: 'row',
        maxWidth: '100%',
        width: '100%',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexShrink: 1,
        paddingHorizontal:12
      }}>
      {mode === INPUT_MODE.NO_EDIT ? (
        <LinkPreview value={value} setMode={setMode} onSubmit={onSubmit} />
      ) : (
        <>
          <TextInput
            ref={inputRef}
            onBlur={onBlur}
            style={{
              height: normalize(50),
              color: colors.pri,
              zIndex: 10,
              flexWrap: 'wrap',
              flexGrow: 1,
              fontSize: SIZE.sm
            }}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyLabel="Done"
            returnKeyType="done"
            onSubmit={onSubmit}
            onChangeText={onChangeText}
            defaultValue={value}
            blurOnSubmit={false}
            placeholder="Enter link"
            placeholderTextColor={colors.icon}
          />

          {mode === INPUT_MODE.EDITING && (
            <Button
              title="Save"
              onPress={onSubmit}
              height={normalize(40)}
              fontSize={SIZE.md}
              style={{marginLeft: 10, paddingHorizontal: 15}}
            />
          )}
        </>
      )}
    </View>
  );
};

export default ToolbarLinkInput;
