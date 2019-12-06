import React, {Fragment, useEffect, useState, createRef} from 'react';
import {View, TextInput, Platform, DeviceEventEmitter} from 'react-native';
import {
  COLOR_SCHEME,
  SIZE,
  br,
  ph,
  pv,
  opacity,
  FONT,
  WEIGHT,
} from '../../common/common';
import Icon from 'react-native-vector-icons/Ionicons';
import {getElevation} from '../../utils/utils';

export const Search = props => {
  const [colors, setColors] = useState(COLOR_SCHEME);
  const [focus, setFocus] = useState(false);
  const inputRef = createRef();
  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: Platform.isPad ? '95%' : '90%',
        alignSelf: 'center',
        borderRadius: br,
        borderWidth: 1.5,
        paddingHorizontal: ph,
        paddingVertical: Platform.OS == 'ios' ? pv - 3 : pv - 8,
        marginBottom: 10,
        borderColor: focus ? colors.navbg : '#f0f0f0',
      }}>
      <TextInput
        ref={inputRef}
        style={{
          fontFamily: WEIGHT.regular,
          maxWidth: '90%',
          width: '90%',
          fontSize: SIZE.md,
        }}
        onChangeText={props.onChangeText}
        onSubmitEditing={props.onSubmitEditing}
        onFocus={() => {
          setFocus(true);
          props.onFocus;
        }}
        onBlur={() => {
          setFocus(false);
          props.onBlur;
        }}
        numberOfLines={1}
        placeholder={props.placeholder}
        placeholderTextColor={colors.icon}
      />
      <Icon
        style={{paddingRight: Platform.isPad ? '1.25%' : '2.5%'}}
        onPress={() => {
          props.value.length > 0 ? props.clearSearch() : null;
          inputRef.current.setNativeProps({
            text: '',
          });
        }}
        name={
          props.value && props.value.length > 0 ? 'ios-close' : 'ios-search'
        }
        color={focus ? colors.accent : colors.icon}
        size={SIZE.xl}
      />
    </View>
  );
};
