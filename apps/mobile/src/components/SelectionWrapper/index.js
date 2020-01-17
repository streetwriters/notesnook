import React from 'react';
import {View, TouchableOpacity} from 'react-native';
import {SIZE} from '../../common/common';
import Icon from 'react-native-vector-icons/Feather';
import {w} from '../../utils/utils';
import {useTracked, ACTIONS} from '../../provider';

const SelectionWrapper = ({children, item}) => {
  const [state, dispatch] = useTracked();
  const {colors, selectionMode, selectedItemsList} = state;

  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: w - 24,

        marginHorizontal: 12,
      }}>
      <TouchableOpacity
        onPress={() => {
          dispatch({type: ACTIONS.SELECTED_ITEMS, item: item});
        }}
        style={{
          width: 50,
          height: 70,
          justifyContent: 'center',
          alignItems: 'flex-start',
          display: selectionMode ? 'flex' : 'none',
          opacity: selectionMode ? 1 : 0,
        }}>
        <View
          style={{
            borderWidth: 2,
            borderColor: selectedItemsList.includes(item)
              ? colors.accent
              : colors.icon,
            width: 30,
            height: 30,
            justifyContent: 'center',
            alignItems: 'center',
            borderRadius: 100,
            paddingTop: 4,
          }}>
          {selectedItemsList.includes(item) ? (
            <Icon size={SIZE.md} color={colors.accent} name="check" />
          ) : null}
        </View>
      </TouchableOpacity>

      {children}
    </View>
  );
};

export default SelectionWrapper;
