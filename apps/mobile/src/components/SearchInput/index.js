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
import * as Animatable from 'react-native-animatable';

export const Search = props => {
  const [colors, setColors] = useState(COLOR_SCHEME);
  const [focus, setFocus] = useState(false);

  const inputRef = createRef();
  return (
    <Animatable.View
      onLayout={e => {
        props.sendHeight(e.nativeEvent.layout.height);
      }}
      transition="opacity"
      duration={300}
      style={{
        opacity: props.hide ? 0 : 1,
      }}>
      <Animatable.View
        transition="height"
        duration={400}
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          width: Platform.isPad ? '95%' : '90%',
          alignSelf: 'center',
          borderRadius: br,
          borderWidth: props.hide ? 0 : 1.5,
          paddingHorizontal: ph,

          paddingVertical: props.hide
            ? 0
            : Platform.OS == 'ios'
            ? pv - 3
            : pv - 8,
          marginBottom: props.hide ? 0 : 10,
          borderColor: focus ? colors.accent : colors.nav,
          height: props.hide ? 0 : 55,
        }}>
        <TextInput
          ref={inputRef}
          style={{
            fontFamily: WEIGHT.regular,
            color: colors.pri,
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
            props.clear();
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
      </Animatable.View>
    </Animatable.View>
  );
};
