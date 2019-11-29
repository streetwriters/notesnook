import React from 'react';
import {View, TouchableOpacity, Platform, Text} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import {SIZE, WEIGHT} from '../../common/common';
import {h} from '../../utils/utils';

export const Header = ({heading, colors, canGoBack = true}) => {
  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'flex-start',
        alignItems: 'center',
        paddingHorizontal: Platform.isPad ? '2.5%' : '5%',
        marginTop: Platform.OS == 'ios' ? h * 0.02 : h * 0.04,
        marginBottom: h * 0.04,
      }}>
      {canGoBack ? (
        <TouchableOpacity
          style={{
            paddingRight: 20,
            justifyContent: 'center',
            alignItems: 'center',
          }}>
          <Icon name="ios-arrow-back" size={SIZE.xl} />
        </TouchableOpacity>
      ) : (
        undefined
      )}

      <Text
        style={{
          fontSize: SIZE.xxl,
          color: colors.pri,
          fontFamily: WEIGHT.bold,
        }}>
        {heading}
      </Text>
    </View>
  );
};
