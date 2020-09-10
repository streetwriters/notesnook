import React, { useEffect } from 'react';
import { Text, View } from 'react-native';
import { COLORS_NOTE, pv, SIZE } from '../../common/common';
import { useTracked } from '../../provider';
import { ACTIONS } from '../../provider/actions';
import { eSendEvent } from '../../services/eventManager';
import { refreshNotesPage } from '../../services/events';
import NavigationService from '../../services/NavigationService';
import { PressableButton } from '../PressableButton';

export const ColorSection = ({noTextMode}) => {
  const [state, dispatch] = useTracked();
  const {colors, colorNotes} = state;

  useEffect(() => {
    dispatch({type: ACTIONS.TAGS});
  }, []);

  return (
    <View
      style={{
        width: '100%',
        paddingHorizontal: 10,
      }}>
      {colorNotes.map((item) => (
        <PressableButton
          key={item.id}
          onPress={_onPress}
          color={
            currentScreen === item.name.toLowerCase()
              ? colors.shade
              : 'transparent'
          }
          selectedColor={colors.accent}
          alpha={!colors.night ? -0.02 : 0.02}
          opacity={0.12}
          onPress={() => {
            let params = {
              type: 'color',
              title: item.title,
              color: item,
            };
            dispatch({
              type: ACTIONS.HEADER_VERTICAL_MENU,
              state: false,
            });

            dispatch({
              type: ACTIONS.CONTAINER_BOTTOM_BUTTON,
              state: {
                bottomButtonText: 'Create a new Note',
              },
            });
            dispatch({
              type: ACTIONS.HEADER_TEXT_STATE,
              state: {
                heading: item.title,
              },
            });

            NavigationService.navigate('Notes', params);
            eSendEvent(refreshNotesPage, params);
            sideMenuRef.current?.closeDrawer();
          }}
          style={{
            flexDirection: 'row',
            justifyContent: noTextMode ? 'center' : 'flex-start',
            alignItems: 'center',
            width: '100%',
            paddingVertical: pv,
          }}>
          <View
            style={{
              width: 35,
              height: 35,
              justifyContent: 'center',
              alignItems: 'center',
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
              <Text
                style={{
                  color: colors.pri,
                  fontSize: SIZE.sm - 1,
                }}>
                {item.title.slice(0, 1).toUpperCase() + item.title.slice(1)}
              </Text>

              <Text
                style={{
                  color: colors.icon,
                  fontSize: SIZE.xs,
                  paddingHorizontal: 5,
                }}>
                {item.noteIds.length > 99 ? '99+' : item.noteIds.length}
              </Text>
            </View>
          )}
        </PressableButton>
      ))}
    </View>
  );
};
