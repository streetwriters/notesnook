import React, { useEffect, useState } from 'react';
import { View, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useThemeStore } from '../../../../stores/use-theme-store';
import { eSendEvent, eSubscribeEvent, eUnSubscribeEvent } from '../../../../services/event-manager';
import { normalize, SIZE } from '../../../../utils/size';
import { formatSelection, properties, rgbToHex } from './constants';
import { execCommands } from './commands';
import { MMKV } from '../../../../utils/database/mmkv';

const ColorItem = ({ value, format, onCustomPress, checked }) => {
  const colors = useThemeStore(state => state.colors);
  const [selected, setSelected] = useState(false);
  const isChecked = value !== '' && (selected || checked);
  const isNil = value === '';

  useEffect(() => {
    if (onCustomPress) return;
    eSubscribeEvent('onSelectionChange', onSelectionChange);
    return () => {
      eUnSubscribeEvent('onSelectionChange', onSelectionChange);
    };
  }, [selected]);

  useEffect(() => {
    if (onCustomPress) return;
    onSelectionChange(properties.selection);
  }, []);

  const onSelectionChange = data => {
    if (properties.pauseSelectionChange) return;
    checkForChanges(data);
  };

  const checkForChanges = data => {
    properties.selection = data;
    let formats = Object.keys(data);
    let _color;
    if (data[format] !== null) {
      if (data[format]?.startsWith('#')) {
        _color = data[format];
      } else {
        _color = rgbToHex(data[format]);
      }
    }
    if (formats.indexOf(format) > -1 && _color === value) {
      setSelected(true);
      return;
    }
    setSelected(false);
  };

  const onPress = async () => {
    if (onCustomPress) {
      onCustomPress(value);
      return;
    }
    if (selected) {
      formatSelection(execCommands[format](''));
      await MMKV.removeItem(`d${format}`);
    } else {
      formatSelection(execCommands[format](value));
      MMKV.setString(`d${format}`, value);
    }
    eSendEvent('onColorChange');
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={{
        backgroundColor: isNil ? 'transparent' : value,
        borderWidth: 1,
        borderColor: colors.nav,
        borderRadius: 5,
        height: normalize(40),
        width: normalize(40),
        marginRight: 5,
        overflow: 'hidden'
      }}
    >
      <View
        style={{
          height: '100%',
          width: '100%',
          borderRadius: 5,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: isChecked ? 'rgba(0,0,0,0.1)' : 'transparent'
        }}
      >
        {isNil ? <Icon color="red" size={SIZE.lg} name="close" /> : null}

        {isChecked ? <Icon name="check" size={SIZE.lg} color="white" /> : null}
      </View>
    </TouchableOpacity>
  );
};

export default ColorItem;
