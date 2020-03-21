import React, {useEffect, useState} from 'react';
import {TextInput} from 'react-native';
import Animated, {Easing} from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {br, SIZE, WEIGHT} from '../../common/common';
import {useTracked} from '../../provider';
import {inputRef} from '../../utils/refs';
import {DDS} from '../../utils/utils';

const {Value, timing, block} = Animated;

export const Search = props => {
  const [state, dispatch] = useTracked();
  const {colors, searchResults} = state;

  const [focus, setFocus] = useState(false);

  const _marginAnim = new Value(0);
  const _opacity = new Value(1);
  const _borderAnim = new Value(1.5);

  useEffect(() => {
    timing(_marginAnim, {
      toValue: props.hide ? -65 : 0,
      duration: 230,
      easing: Easing.inOut(Easing.ease),
    }).start();
    timing(_opacity, {
      toValue: props.hide ? 0 : 1,
      duration: 250,
      easing: Easing.inOut(Easing.ease),
    }).start();
    timing(_borderAnim, {
      toValue: props.hide ? 0 : 1.5,
      duration: 270,
      easing: Easing.inOut(Easing.ease),
    }).start();
  }, [props.hide]);

  return (
    <Animated.View
      transition={['marginTop', 'opacity']}
      duration={200}
      style={{
        opacity: props.hide ? 0 : 1,
        height: 60,
        justifyContent: 'center',
        marginTop: props.hide ? -65 : 0,
        paddingHorizontal: 12,
      }}>
      <Animated.View
        transition={['borderWidth']}
        duration={300}
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingLeft: 12,
          width: '100%',
          alignSelf: 'center',
          borderRadius: br,
          height: '90%',
          borderWidth: props.hide ? 0 : 1.5,
          borderColor: focus
            ? props.headerColor
              ? props.headerColor
              : colors.accent
            : colors.nav,
        }}>
        <TextInput
          ref={inputRef}
          style={{
            fontFamily: WEIGHT.regular,
            color: colors.pri,
            maxWidth: '85%',
            width: '85%',
            fontSize: SIZE.sm,
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
          style={{paddingRight: DDS.isTab ? 12 : 12}}
          onPress={() => {
            props.onSubmitEditing();
          }}
          name="magnify"
          color={
            focus
              ? props.headerColor
                ? props.headerColor
                : colors.accent
              : colors.icon
          }
          size={SIZE.xl}
        />
      </Animated.View>
    </Animated.View>
  );
};
