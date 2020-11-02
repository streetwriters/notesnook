import React, {useState} from 'react';
import {View} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {useTracked} from '../../provider';
import {Actions} from '../../provider/Actions';
import {DDS} from '../../services/DeviceDetection';
import {sendNoteEditedEvent} from '../../services/EventManager';
import { dWidth } from '../../utils';
import {COLORS_NOTE} from '../../utils/Colors';
import {hexToRGBA, RGB_Linear_Shade} from '../../utils/ColorUtils';
import {db} from '../../utils/DB';
import {SIZE} from '../../utils/SizeUtils';
import {PressableButton} from '../PressableButton';

export const ActionSheetColorsSection = ({item}) => {
  const [state, dispatch] = useTracked();
  const {colors} = state;
  const [note, setNote] = useState(item);

  const localRefresh = () => {
    toAdd = db.notes.note(note.id);
    if (toAdd) {
      toAdd = toAdd.data;
    } else {
      setTimeout(() => {
        toAdd = db.notes.note(note.id);
        if (toAdd) {
          toAdd = toAdd.data;
        }
      }, 500);
    }
    setNote({...toAdd});
  };

  const _renderColor = (c) => {
    const color = {
      name: c,
      value: COLORS_NOTE[c],
    };

    return (
      <PressableButton
        color={RGB_Linear_Shade(
          !colors.night ? -0.2 : 0.2,
          hexToRGBA(color.value, 1),
        )}
        selectedColor={color.value}
        alpha={!colors.night ? -0.1 : 0.1}
        opacity={1}
        key={color.value}
        onPress={async () => {
          let noteColors = note.colors;

          if (noteColors.includes(color.name)) {
            await db.notes.note(note.id).uncolor(color.name);
          } else {
            await db.notes.note(note.id).color(color.name);
          }
          dispatch({type: Actions.COLORS});
          sendNoteEditedEvent(note.id, false, true);
          localRefresh();
        }}
        customStyle={{
          width: DDS.isTab ? 400 / 10 : dWidth / 10,
          height: DDS.isTab ? 400 / 10 : dWidth / 10,
          borderRadius: 100,
          justifyContent: 'center',
          alignItems: 'center',
        }}>
        {note && note.colors && note.colors.includes(color.name) ? (
          <Icon name="check" color="white" size={SIZE.lg} />
        ) : null}
      </PressableButton>
    );
  };

  return (
    <View
      style={{
        flexDirection: 'row',
        flexWrap: 'wrap',
        paddingHorizontal: 12,
        width: '100%',
        marginVertical: 10,
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
      {Object.keys(COLORS_NOTE).map(_renderColor)}
    </View>
  );
};
