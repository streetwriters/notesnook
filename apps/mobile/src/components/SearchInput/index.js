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
import {getElevation, w} from '../../utils/utils';
import * as Animatable from 'react-native-animatable';
import {DDS} from '../../../App';
import {useAppContext} from '../../provider/useAppContext';
import {useTracked} from '../../provider';
export const Search = props => {
  const [state, dispatch] = useTracked();
  const {colors} = state;

  const [focus, setFocus] = useState(false);

  const inputRef = createRef();
  return (
    <Animatable.View
      transition={['marginTop', 'borderWidth', 'marginBottom', 'opacity']}
      duration={200}
      style={{
        opacity: props.hide ? 0 : 1,
        height: 60,
        justifyContent: 'center',
        marginTop: props.hide ? -65 : 0,
      }}>
      <Animatable.View
        transition={['borderWidth']}
        duration={300}
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingHorizontal: 12,
          width: w - 24,
          alignSelf: 'center',
          borderRadius: br,
          height: '90%',
          borderWidth: props.hide ? 0 : 1.5,
          borderColor: focus ? colors.accent : colors.nav,
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
          style={{paddingRight: DDS.isTab ? '1.25%' : '2.5%'}}
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
