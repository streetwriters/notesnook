import React, {useEffect} from 'react';
import {Text, View} from 'react-native';
import {useTracked} from '../../provider';
import {Actions} from '../../provider/Actions';
import {eSendEvent} from '../../services/EventManager';
import NavigationService from '../../services/Navigation';
import {refreshNotesPage} from '../../utils/Events';
import { sideMenuRef } from '../../utils/Refs';
import {SIZE, WEIGHT} from '../../utils/SizeUtils';
import {PressableButton} from '../PressableButton';
import Paragraph from '../Typography/Paragraph';

export const TagsSection = () => {
  const [state, dispatch] = useTracked();
  const {colors, tags, currentScreen} = state;

  useEffect(() => {
    dispatch({type: Actions.TAGS});
  }, []);

  const onPress = (item) => {
    let params = {
      title: item.title,
      tag: item,
      type: 'tag',
      menu: true,
    };
    dispatch({
      type: Actions.HEADER_VERTICAL_MENU,
      state: false,
    });
    dispatch({
      type: Actions.HEADER_TEXT_STATE,
      state: {
        heading: item.title,
      },
    });
    NavigationService.navigate('NotesPage', params);
    eSendEvent(refreshNotesPage, params);
    sideMenuRef.current?.openMenu(false)
  };

  return (
    <View
      style={{
        width: '100%',
      }}>
      {tags
        .filter((o) => o.noteIds.length > 1)
        .slice(0, tags.length > 10 ? 10 : tags.length)
        .map((item) => (
          <PressableButton
            key={item.id}
            color={
              currentScreen === item.title.toLowerCase()
                ? colors.shade
                : 'transparent'
            }
            selectedColor={colors.accent}
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
              <Paragraph color={colors.accent} size={SIZE.md}>
                #
              </Paragraph>
            </View>
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                width: '85%',
              }}>
              <Paragraph color={colors.heading}>{item.title}</Paragraph>

            </View>
          </PressableButton>
        ))}
    </View>
  );
};
