import React from 'react';
import { TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTracked } from '../../provider';
import { useSettingStore } from '../../provider/stores';
import { eSendEvent } from '../../services/EventManager';
import { getElevation } from '../../utils';
import { eOpenSortDialog } from '../../utils/Events';
import { SIZE } from '../../utils/SizeUtils';
import Heading from '../Typography/Heading';

export const HeaderMenu = () => {
  const [state] = useTracked();
  const {colors} = state;
  const settings = useSettingStore(state => state.settings);

  return (
    <TouchableOpacity
      onPress={() => {
        eSendEvent(eOpenSortDialog);
      }}
      hitSlop={{top: 15, right: 10, left: 30, bottom: 15}}
      activeOpacity={1}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        zIndex: 10,
        height: 22,
        backgroundColor: colors.accent,
        paddingHorizontal: 8,
        borderRadius: 100,
        ...getElevation(2)
      }}>
      <Heading
        color={colors.light}
        size={SIZE.sm}
        style={{
          marginRight: 5,
          textAlignVertical: 'center',
        }}>
        {settings.sort.slice(0, 1).toUpperCase() +
          settings.sort.slice(1, settings.sort.length)}
      </Heading>
      <Icon
        color={colors.light}
        name={
          settings.sortOrder === 'asc' ? 'sort-ascending' : 'sort-descending'
        }
        style={{
          textAlignVertical: 'center',
        }}
        size={SIZE.md}
      />
    </TouchableOpacity>
  );
};
