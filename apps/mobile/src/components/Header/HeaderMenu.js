import React from 'react';
import { TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTracked } from '../../provider';
import { eSendEvent } from '../../services/EventManager';
import { eOpenSortDialog } from '../../utils/Events';
import { SIZE } from '../../utils/SizeUtils';
import Paragraph from '../Typography/Paragraph';

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
        zIndex:10,
        height: 35,
      }}>
      <Paragraph
        style={{
          marginRight: 5,
          textAlignVertical:'center'
        }}>
        {settings.sort.slice(0, 1).toUpperCase() +
          settings.sort.slice(1, settings.sort.length)}
      </Paragraph>
      <Icon
        color={colors.pri}
        name={
          settings.sortOrder === 'asc' ? 'sort-ascending' : 'sort-descending'
        }
        style={{
          textAlignVertical:'center',
        }}
        size={SIZE.md}
      />
    </TouchableOpacity>
  );
};
