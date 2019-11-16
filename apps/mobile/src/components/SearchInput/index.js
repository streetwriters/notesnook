import React, {Fragment, useEffect, useState} from 'react';
import {View, TextInput, Platform} from 'react-native';
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

export const Search = () => {
  const [colors, setColors] = useState(COLOR_SCHEME);
  return (
    <View
      style={{
        ...getElevation(10),
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '90%',
        backgroundColor: '#f0f0f0',
        alignSelf: 'center',
        borderRadius: br,
        paddingHorizontal: ph,
        paddingVertical: Platform.OS == 'ios' ? pv : pv - 5,
        marginTop: 10,
        marginBottom: 25,
      }}>
      <TextInput
        style={{
          fontFamily: WEIGHT.regular,
          maxWidth: '90%',
          width: '90%',
          fontSize: SIZE.md,
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
