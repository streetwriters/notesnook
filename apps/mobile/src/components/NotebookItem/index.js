import React, {useEffect, useState} from 'react';
import {View, Text, TouchableOpacity} from 'react-native';
import NavigationService from '../../services/NavigationService';

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
import Icon from 'react-native-vector-icons/Feather';
export const NotebookItem = ({
  item,
  index,
  colors,
  hideMore,
  isTopic = false,
}) => {
  return (
    <TouchableOpacity
      onPress={() => {
        NavigationService.navigate('Notebook', {
          notebook: item,
          title: hideMore ? 'Choose topic' : item.name,
          isMove: hideMore ? true : false,
          hideMore: hideMore ? true : false,
        });
      }}
      style={{
        paddingHorizontal: ph,
        marginHorizontal: '5%',
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
        paddingVertical: pv + 5,
      }}>
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
        <View>
          <Text
            style={{
              fontFamily: WEIGHT.bold,
              fontSize: SIZE.md,
              color: colors.pri,
              maxWidth: '100%',
            }}>
            {item.name}
          </Text>

          <Text
            style={{
              fontFamily: WEIGHT.regular,
              fontSize: SIZE.xs,
              paddingTop: pv / 2,
            }}>
            15 notes
          </Text>
        </View>

        {hideMore ? null : (
          <Icon name="more-vertical" size={SIZE.lg} color={colors.icon} />
        )}
        {hideMore && isTopic ? (
          <TouchableOpacity
            activeOpacity={opacity}
            onPress={() => {
              NavigationService.navigate('Home');
            }}
            style={{
              borderWidth: 1,
              borderRadius: 5,
              width: '20%',
              paddingHorizontal: ph - 5,
              borderColor: '#f0f0f0',
              paddingVertical: pv,
              flexDirection: 'row',
              justifyContent: 'center',
              alignItems: 'center',
              backgroundColor: colors.accent,
            }}>
            <Text
              style={{
                fontSize: SIZE.xs,
                fontFamily: WEIGHT.semibold,
                color: 'white',
              }}>
              Move
            </Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </TouchableOpacity>
  );
};
