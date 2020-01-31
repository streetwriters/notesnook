import React, {useEffect, useState} from 'react';
import {TouchableWithoutFeedback, View} from 'react-native';
import * as Animatable from 'react-native-animatable';
import Icon from 'react-native-vector-icons/Feather';
import {SIZE} from '../../common/common';
import {useTracked} from '../../provider';
import {ACTIONS} from '../../provider/actions';
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
    <Animatable.View
      animation="fadeIn"
      useNativeDriver={true}
      duration={300 * index + 1}
      delay={index * 300}
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
        }}>
        <TouchableWithoutFeedback
          onPress={() => {
            dispatch({type: ACTIONS.SELECTED_ITEMS, item: item});
          }}
          style={{
            width: '10%',
            height: 70,
            justifyContent: 'center',
            alignItems: 'center',
            paddingRight: 15,
          }}>
          <View
            style={{
              borderWidth: 2,
              borderColor: selected ? colors.accent : colors.icon,
              width: 30,
              height: 30,
              justifyContent: 'center',
              alignItems: 'center',
              borderRadius: 100,
              paddingTop: 4,
            }}>
            {selected ? (
              <Icon size={SIZE.md} color={colors.accent} name="check" />
            ) : null}
          </View>
        </TouchableWithoutFeedback>
      </View>
      {children}
    </Animatable.View>
  );
};

export default SelectionWrapper;
