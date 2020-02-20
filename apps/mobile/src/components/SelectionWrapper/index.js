import React, {useEffect, useState} from 'react';
import {TouchableWithoutFeedback, View} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {SIZE} from '../../common/common';
import {useTracked} from '../../provider';
import {ACTIONS} from '../../provider/actions';
import Animated from 'react-native-reanimated';

const SelectionWrapper = ({children, item, currentEditingNote, index}) => {
  const [state, dispatch] = useTracked();
  const {colors, selectionMode, selectedItemsList} = state;
  const [selected, setSelected] = useState(false);
  useEffect(() => {
    let exists = selectedItemsList.filter(
      o => o.dateCreated === item.dateCreated,
    );

    if (exists[0]) {
      if (!selected) {
        setSelected(true);
      }
    } else {
      if (selected) {
        setSelected(false);
      }
    }
  }, [selectedItemsList]);

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
        style={{
          display: selectionMode ? 'flex' : 'none',
          opacity: selectionMode ? 1 : 0,
          width: '10%',
          height: 70,
          justifyContent: 'center',
          alignItems: 'center',
          paddingRight: 8,
        }}>
        <TouchableWithoutFeedback
          onPress={() => {
            dispatch({type: ACTIONS.SELECTED_ITEMS, item: item});
          }}
          style={{
            justifyContent: 'center',
            alignItems: 'center',
          }}>
          <Icon
            size={SIZE.lg}
            color={colors.accent}
            name={
              selected
                ? 'check-circle-outline'
                : 'checkbox-blank-circle-outline'
            }
          />
        </TouchableWithoutFeedback>
      </View>

      {children}
    </View>
  );
};

export default SelectionWrapper;
