import React, {createRef, useState} from 'react';
import {TextInput} from 'react-native';
import * as Animatable from 'react-native-animatable';
import Icon from 'react-native-vector-icons/Feather';
import {DDS} from '../../../App';
import {br, SIZE, WEIGHT} from '../../common/common';
import {useTracked} from '../../provider';
export const Search = props => {
  const [state, dispatch] = useTracked();
  const {colors} = state;

  const [focus, setFocus] = useState(false);
  const inputRef = createRef();

  return (
    <Animatable.View
      transition={['marginTop', 'opacity']}
      duration={200}
      style={{
        opacity: props.hide ? 0 : 1,
        height: 60,
        justifyContent: 'center',
        marginTop: props.hide ? -65 : 0,
        paddingHorizontal: 12,
      }}>
      <Animatable.View
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
          borderColor: focus ? colors.accent : colors.nav,
        }}>
        <TextInput
          ref={inputRef}
          style={{
            fontFamily: WEIGHT.regular,
            color: colors.pri,
            maxWidth: '85%',
            width: '85%',
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
          style={{paddingRight: DDS.isTab ? 12 : 12}}
          onPress={() => {
            props.clear();
            props.value.length > 0 ? props.clearSearch() : null;
            inputRef.current.setNativeProps({
              text: '',
            });
          }}
          name={props.value && props.value.length > 0 ? '' : 'search'}
          color={focus ? colors.accent : colors.icon}
          size={SIZE.xl}
        />
      </Animatable.View>
    </Animatable.View>
  );
};
