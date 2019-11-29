import React, {Fragment, useEffect, useState} from 'react';
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

  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: Platform.isPad ? '95%' : '90%',
        backgroundColor: '#f0f0f0',
        alignSelf: 'center',
        borderRadius: br,
        paddingHorizontal: ph,
        paddingVertical: Platform.OS == 'ios' ? pv - 3 : pv - 8,
        marginBottom: 10,
      }}>
      <TextInput
        style={{
          fontFamily: WEIGHT.regular,
          maxWidth: '90%',
          width: '90%',
          fontSize: SIZE.md,
        }}
        onChangeText={props.onChangeText}
        onSubmitEditing={props.onSubmitEditing}
        onFocus={props.onFocus}
        onBlur={props.onBlur}
        numberOfLines={1}
        placeholder="Search your notes"
        placeholderTextColor={colors.icon}
      />
      <Icon
        style={{paddingRight: Platform.isPad ? '1.25%' : '2.5%'}}
        name="ios-search"
        color={colors.icon}
        size={SIZE.xl}
      />
    </View>
  );
};
