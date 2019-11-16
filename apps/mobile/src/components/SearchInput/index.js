import React, {Fragment, useEffect, useState} from 'react';
import {View, TextInput} from 'react-native';
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

export const Search = () => {
  const [colors, setColors] = useState(COLOR_SCHEME);
  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '90%',
        backgroundColor: '#f0f0f0',
        alignSelf: 'center',
        borderRadius: br,
        paddingHorizontal: ph,
        paddingVertical: pv - 5,
        elevation: 5,
        marginTop: 25,
      }}>
      <TextInput
        style={{
          fontFamily: WEIGHT.regular,
          maxWidth: '90%',
          width: '90%',
        }}
        numberOfLines={1}
        placeholder="Search your notes"
      />
      <Icon
        style={{paddingRight: '2.5%'}}
        name="ios-search"
        color={colors.icon}
        size={SIZE.xl}
      />
    </View>
  );
};
