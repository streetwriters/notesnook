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
import {getElevation} from '../../utils';
import {COLORS_NOTE} from '../../utils/Colors';
import {db} from '../../utils/DB';
import {refreshNotesPage} from '../../utils/Events';
import {SIZE} from '../../utils/SizeUtils';
import {PressableButton} from '../PressableButton';
import Heading from '../Typography/Heading';
import Paragraph from '../Typography/Paragraph';

export const ColorSection = () => {
  const [state, dispatch] = useTracked();
  const {colorNotes, loading} = state;

  useEffect(() => {
    if (!loading) {
      dispatch({type: Actions.COLORS});
    }
  }, [loading]);

  return colorNotes.map((item, index) => (
    <ColorItem key={item.id} item={item} index={index} />
  ));
};

const ColorItem = ({item, index}) => {
  const [state, dispatch] = useTracked();
  const {colors} = state;
  const [headerTextState, setHeaderTextState] = useState(null);

  const onHeaderStateChange = (event) => {
    console.log(event);
    if (event.id === item.id) {
      console.log('here');
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
      customColor="transparent"
      customSelectedColor={COLORS_NOTE[item.title]}
      customAlpha={!colors.night ? -0.02 : 0.02}
      customOpacity={0.12}
      onPress={() => onPress(item)}
      customStyle={{
        width: '100%',
        alignSelf: 'center',
        borderRadius: 0,
        flexDirection: 'row',
        paddingHorizontal: 8,
        justifyContent: 'space-between',
        alignItems: 'center',
        height: 40,
      }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
        }}>
        <View
          style={{
            width: 30,
            height: 30,
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
        {headerTextState?.id === item.id ? (
          <Heading color={COLORS_NOTE[item.title.toLowerCase()]} size={SIZE.md}>
            {item.title.slice(0, 1).toUpperCase() + item.title.slice(1)}
          </Heading>
        ) : (
          <Paragraph color={colors.heading} size={SIZE.md}>
            {item.title.slice(0, 1).toUpperCase() + item.title.slice(1)}
          </Paragraph>
        )}
      </View>

      <View
        style={{
          backgroundColor:
            headerTextState?.id === item.id
              ? COLORS_NOTE[item.title.toLowerCase()]
              : 'transparent',
          width: 7,
          height: 7,
          borderRadius: 100,
          ...getElevation(5),
        }}
      />
    </PressableButton>
  );
};
