import React, {useEffect} from 'react';
import {Text, View} from 'react-native';
import {useTracked} from '../../provider';
import {Actions} from '../../provider/Actions';
import {eSendEvent} from '../../services/EventManager';
import {refreshNotesPage} from '../../utils/Events';
import NavigationService from '../../services/Navigation';
import {PressableButton} from '../PressableButton';
import {COLORS_NOTE} from '../../utils/Colors';
import {SIZE, WEIGHT} from '../../utils/SizeUtils';
import Paragraph from '../Typography/Paragraph';
import {sideMenuRef} from '../../utils/Refs';

export const ColorSection = ({noTextMode}) => {
  const [state, dispatch] = useTracked();
  const {colors, colorNotes, currentScreen} = state;

  useEffect(() => {
    dispatch({type: Actions.TAGS});
  }, []);

  const onPress = (item) => {
    let params = {
      type: 'color',
      title: item.title,
      color: item,
      menu: true,
    };
    dispatch({
      type: Actions.HEADER_VERTICAL_MENU,
      state: false,
    });

    dispatch({
      type: Actions.CURRENT_SCREEN,
      screen: item.title,
    });

    dispatch({
      type: Actions.HEADER_TEXT_STATE,
      state: {
        heading: item.title.slice(0, 1).toUpperCase() + item.title.slice(1),
      },
    });

    NavigationService.navigate('NotesPage', params);
    eSendEvent(refreshNotesPage, params);
    NavigationService.closeDrawer();
  };

  return (
    <View
      style={{
        width: '100%',
      }}>
      {colorNotes.map((item) => (
        <PressableButton
          key={item.id}
          color={
            currentScreen === item.title
              ? COLORS_NOTE[item.title]
              : 'transparent'
          }
          selectedColor={COLORS_NOTE[item.title]}
          alpha={!colors.night ? -0.02 : 0.02}
          opacity={0.12}
          onPress={() => onPress(item)}
          customStyle={{
            flexDirection: 'row',
            justifyContent: noTextMode ? 'center' : 'flex-start',
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

          {noTextMode ? null : (
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
          )}
        </PressableButton>
      ))}
    </View>
  );
};
