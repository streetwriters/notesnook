import React from 'react';
import {useTracked} from '../../provider';
import {SIZE, WEIGHT} from '../../utils/SizeUtils';
import {Text, TouchableOpacity} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {eSendEvent} from '../../services/EventManager';
import {eOpenSortDialog} from '../../utils/Events';

export const HeaderMenu = () => {
  const [state] = useTracked();
  const {colors, settings} = state;

  return (
    <TouchableOpacity
      onPress={() => {
        eSendEvent(eOpenSortDialog);
      }}
      hitSlop={{top: 10, right: 10, left: 30, bottom: 15}}
      activeOpacity={1}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        zIndex:10
      }}>
      <Text
        style={{
          fontSize: SIZE.xs + 1,
          fontFamily: WEIGHT.regular,
          color: colors.pri,
          marginRight: 5,
          height: 30,
          textAlignVertical: 'bottom',
        }}>
        {settings.sort.slice(0, 1).toUpperCase() +
          settings.sort.slice(1, settings.sort.length)}
      </Text>
      <Icon
        color={colors.pri}
        name={
          settings.sortOrder === 'asc' ? 'sort-ascending' : 'sort-descending'
        }
        style={{
          textAlignVertical: 'bottom',
          height: 30,
        }}
        size={SIZE.md}
      />
    </TouchableOpacity>
  );
};
