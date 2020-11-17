import React, {useEffect, useState} from 'react';
import {TouchableOpacity, View} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {useTracked} from '../../provider';
import {Actions} from '../../provider/Actions';
import {ToastEvent} from '../../services/EventManager';
import {COLORS_NOTE} from '../../utils/Colors';
import {db} from '../../utils/DB';
import {SIZE} from '../../utils/SizeUtils';
import {PressableButton} from '../PressableButton';

const SelectionWrapper = ({
  children,
  item,
  index,
  background,
  onLongPress,
  onPress,
}) => {
  const [state, dispatch] = useTracked();
  const {colors, selectionMode, selectedItemsList, currentEditingNote} = state;
  const [selected, setSelected] = useState(false);
  useEffect(() => {
    let exists = selectedItemsList.filter(
      (o) => o.dateCreated === item.dateCreated,
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

  const onPressPin = async () => {
    let func = async () => {
      if (!item.id) return;
      if (item.type === 'note') {
        await db.notes.note(item.id).pin();
        dispatch({type: Actions.PINNED});
        dispatch({type: Actions.NOTES});
      } else {
        await db.notebooks.notebook(item.id).pin();
        dispatch({type: Actions.PINNED});
        dispatch({type: Actions.NOTEBOOKS});
      }
    };
    func();
    ToastEvent.show(
      item.type + ' has been unpinned.',
      'success',
      'global',
      6000,
      () => {
        func();
        ToastEvent.hide('unpin');
      },
      'Undo',
    );
  };

  return (
    <PressableButton
      color={
        currentEditingNote === item.id
          ? item.type === 'note' && item.colors[0]
            ? COLORS_NOTE[item.colors[0]]
            : colors.shade
          : background
          ? background
          : 'transparent'
      }
      onLongPress={onLongPress}
      onPress={onPress}
      selectedColor={currentEditingNote ? colors.accent : colors.nav}
      alpha={!colors.night ? -0.02 : 0.02}
      opacity={currentEditingNote ? 0.15 : 1}
      customStyle={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%',
        paddingHorizontal: 12,
        borderRadius: 0,
        marginTop:
          index === 0 && !selectionMode
            ? 15
            : index === 0 && selectionMode
            ? 30
            : 0,
      }}>
      {/*  {item.pinned ? (
        <PressableButton
          color={item.colors[0] ? COLORS_NOTE[item.colors[0]] : colors.accent}
          selectedColor={
            item.colors[0] ? COLORS_NOTE[item.colors[0]] : colors.accent
          }
          alpha={!colors.night ? -0.1 : 0.1}
          onPress={onPressPin}
          customStyle={{
            ...getElevation(3),
            width: 30,
            height: 30,
            borderRadius: 100,
            position: 'absolute',
            right: 20,
            top: -15,
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 10,
          }}>
          <View
            style={{
              width: 5,
              height: 5,
              backgroundColor: 'white',
              borderRadius: 100,
            }}
          />
        </PressableButton>
      ) : null} */}

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
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => {
            dispatch({type: Actions.SELECTED_ITEMS, item: item});
          }}
          style={{
            justifyContent: 'center',
            alignItems: 'center',
            height: 70,
          }}>
          <Icon
            size={SIZE.lg}
            color={selected ? colors.accent : colors.icon}
            name={
              selected
                ? 'check-circle-outline'
                : 'checkbox-blank-circle-outline'
            }
          />
        </TouchableOpacity>
      </View>

      {children}
    </PressableButton>
  );
};

export default SelectionWrapper;
