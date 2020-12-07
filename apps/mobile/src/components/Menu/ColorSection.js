import React, {useEffect, useState} from 'react';
import {View} from 'react-native';
import {useTracked} from '../../provider';
import {Actions} from '../../provider/Actions';
import {
  eSendEvent,
  eSubscribeEvent,
  eUnSubscribeEvent,
} from '../../services/EventManager';
import Navigation from '../../services/Navigation';
import {COLORS_NOTE} from '../../utils/Colors';
import {refreshNotesPage} from '../../utils/Events';
import {SIZE} from '../../utils/SizeUtils';
import {PressableButton} from '../PressableButton';
import Paragraph from '../Typography/Paragraph';

export const ColorSection = ({noTextMode}) => {
  const [state, dispatch] = useTracked();
  const {colorNotes} = state;

  useEffect(() => {
    dispatch({type: Actions.COLORS});
  }, []);

  return (
    <View
      style={{
        width: '100%',
      }}>
      {colorNotes.map((item, index) => (
        <ColorItem item={item} index={index} />
      ))}
    </View>
  );
};

const ColorItem = ({item, index}) => {
  const [state, dispatch] = useTracked();
  const {colors} = state;
  const [headerTextState, setHeaderTextState] = useState(null);

  const onHeaderStateChange = (event) => {
    if (event.id === item.name) {
      setHeaderTextState(event);
    } else {
      setHeaderTextState(null);
    }
  };

  useEffect(() => {
    eSubscribeEvent('onHeaderStateChange', onHeaderStateChange);
    return () => {
      eUnSubscribeEvent('onHeaderStateChange', onHeaderStateChange);
    };
  }, []);

  const onPress = (item) => {
    let params = {
      type: 'color',
      title: item.title,
      color: item,
      menu: true,
    };
    Navigation.navigate('NotesPage', params, {
      heading: item.title.slice(0, 1).toUpperCase() + item.title.slice(1),
      id: item.id,
      type: 'color',
    });
    eSendEvent(refreshNotesPage, params);
    Navigation.closeDrawer();
  };

  return (
    <PressableButton
      key={item.id}
      customColor={
        headerTextState?.id === item.id && item.type === headerTextState?.type
          ? COLORS_NOTE[item.title]
          : 'transparent'
      }
      customSelectedColor={COLORS_NOTE[item.title]}
      alpha={!colors.night ? -0.02 : 0.02}
      opacity={0.12}
      onPress={() => onPress(item)}
      customStyle={{
        flexDirection: 'row',
        justifyContent: 'flex-start',
        alignItems: 'center',
        width: '100%',
        borderRadius: 0,
        paddingHorizontal: 10,
        height: 50,
      }}>
      <View
        style={{
          width: 35,
          height: 35,
          justifyContent: 'center',
          alignItems: 'flex-start',
        }}>
        <View
          style={{
            width: SIZE.md,
            height: SIZE.md,
            backgroundColor: COLORS_NOTE[item.title],
            borderRadius: 100,
            justifyContent: 'center',
            marginRight: 10,
          }}
        />
      </View>

      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          width: '85%',
        }}>
        <Paragraph color={colors.heading} size={SIZE.md}>
          {item.title.slice(0, 1).toUpperCase() + item.title.slice(1)}
        </Paragraph>
      </View>
    </PressableButton>
  );
};
