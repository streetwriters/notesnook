import React from 'react';
import {View, TouchableOpacity} from 'react-native';
import {SIZE} from '../../common/common';
import Icon from 'react-native-vector-icons/Feather';
import {w} from '../../utils/utils';
import {useTracked} from '../../provider';
import {ACTIONS} from '../../provider/actions';

const SelectionWrapper = ({children, item, currentEditingNote}) => {
  const [state, dispatch] = useTracked();
  const {colors, selectionMode, selectedItemsList} = state;

  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%',
        paddingHorizontal: 12,
        backgroundColor:
          currentEditingNote === item.dateCreated
            ? colors.shade
            : 'transparent',
      }}>
      <View
        onPress={() => {
          dispatch({type: ACTIONS.SELECTED_ITEMS, item: item});
        }}
        style={{
          width: '10%',
          height: 70,
          justifyContent: 'center',
          alignItems: 'center',
          display: selectionMode ? 'flex' : 'none',
          opacity: selectionMode ? 1 : 0,
          paddingRight: 10,
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
      </View>

      {children}
    </View>
  );
};

export default SelectionWrapper;
