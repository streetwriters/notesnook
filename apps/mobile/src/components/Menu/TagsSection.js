import React, {useEffect} from 'react';
import {Text, TouchableOpacity, View} from 'react-native';
import {useTracked} from '../../provider';
import {Actions} from '../../provider/Actions';
import {eSendEvent} from '../../services/EventManager';
import {refreshNotesPage} from '../../utils/Events';
import NavigationService from '../../services/Navigation';
import {opacity, SIZE, WEIGHT} from '../../utils/SizeUtils';
import {PressableButton} from '../PressableButton';

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
    NavigationService.navigate('Notes', params);
    eSendEvent(refreshNotesPage, params);
    NavigationService.closeDrawer();
  };
  useEffect(() => {
    console.log(currentScreen);
  }, [currentScreen]);
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
              <Text
                style={{
                  color: colors.accent,
                  fontSize: SIZE.md,
                  fontFamily: WEIGHT.regular,
                }}>
                #
              </Text>
            </View>
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                width: '85%',
              }}>
              <Text
                style={{
                  fontFamily: WEIGHT.regular,
                  fontSize: SIZE.sm,
                  color: colors.heading,
                }}>
                {item.title}
              </Text>

              {/*   {item.noteIds.length > 1 ? (
                <Text
                  style={{
                    color: colors.icon,
                    fontSize: SIZE.xs,
                    paddingHorizontal: 5,
                  }}>
                  {item.noteIds.length > 99 ? '99+' : item.noteIds.length}
                </Text>
              ) : null} */}
            </View>
          </PressableButton>
        ))}
    </View>
  );
};
