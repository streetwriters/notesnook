import React, {useEffect, useState} from 'react';
import {TouchableOpacity, View} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {SIZE} from '../../common/common';
import {useTracked} from '../../provider';
import {ACTIONS} from '../../provider/actions';
import {db, getElevation, ToastEvent} from '../../utils/utils';
import {PressableButton} from '../PressableButton';

const SelectionWrapper = ({
  children,
  item,
  currentEditingNote,
  index,
  background,
  pinned,
  onLongPress,
  onPress,
}) => {
  const [state, dispatch] = useTracked();
  const {colors, selectionMode, selectedItemsList} = state;
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
        dispatch({type: ACTIONS.PINNED});
        dispatch({type: ACTIONS.NOTES});
      } else {
        await db.notebooks.notebook(item.id).pin();
        dispatch({type: ACTIONS.PINNED});
        dispatch({type: ACTIONS.NOTEBOOKS});
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
        currentEditingNote === item.dateCreated || pinned
          ? colors.shade
          : background
          ? background
          : 'transparent'
      }
      onLongPress={onLongPress}
      onPress={onPress}
      selectedColor={
        currentEditingNote === item.dateCreated || pinned
          ? colors.accent
          : colors.nav
      }
      alpha={!colors.night ? -0.02 : 0.02}
      opacity={currentEditingNote === item.dateCreated || pinned ? 0.12 : 1}
      customStyle={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%',
        paddingHorizontal: 12,
        marginTop:
          index === 0 && pinned && !selectionMode
            ? 15
            : index === 0 && pinned && selectionMode
            ? 30
            : 0,
      }}>
      {pinned ? (
        <PressableButton
          color={colors.accent}
          selectedColor={colors.accent}
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
      ) : null}

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
            dispatch({type: ACTIONS.SELECTED_ITEMS, item: item});
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
