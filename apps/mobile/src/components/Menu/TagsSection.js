import React, { useEffect } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { useTracked } from '../../provider';
import { Actions } from '../../provider/Actions';
import { eSendEvent } from '../../services/EventManager';
import { refreshNotesPage } from '../../utils/Events';
import NavigationService from '../../services/Navigation';
import {opacity, SIZE, WEIGHT} from "../../utils/SizeUtils";


export const TagsSection = () => {
  const [state, dispatch] = useTracked();
  const {colors,tags} = state;


  useEffect(() => {
    dispatch({type: Actions.TAGS});
  }, []);

  return (<View
    style={{
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginBottom: 0,
    }}>
    {tags
      .filter(o => o.noteIds.length > 1)
      .slice(0, tags.length > 10 ? 10 : tags.length)
      .map(item => (
        <TouchableOpacity
          key={item.title}
          activeOpacity={opacity / 2}
          onPress={() => {
            let params = {
              title: item.title,
              tag: item,
              type: 'tag',
            };

            dispatch({
              type: Actions.HEADER_VERTICAL_MENU,
              state: false,
            });
        
            dispatch({
              type: Actions.CONTAINER_BOTTOM_BUTTON,
              state: {
                bottomButtonText:'Create a new Note',
              },
            });
            dispatch({
              type: Actions.HEADER_TEXT_STATE,
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
            justifyContent: 'flex-start',
            alignItems: 'center',
            padding: 5,
            paddingHorizontal: 0,
            marginLeft: 5,
            marginTop: 5,
            borderBottomWidth: 1,
            borderBottomColor: colors.nav,
          }}>
          <Text
            style={{
              fontFamily: WEIGHT.regular,
              fontSize: SIZE.sm - 1,
              color: colors.accent,
            }}>
            #
          </Text>
          <Text
            style={{
              fontFamily: WEIGHT.regular,
              fontSize: SIZE.sm - 1,
              color: colors.icon,
            }}>
            {item.title + ' '}
          </Text>
          {item.noteIds.length > 1 ? (
            <Text
              style={{
                color: 'white',
                backgroundColor: colors.accent,
                fontSize: SIZE.xxs,
                minWidth: 12,
                minHeight: 12,
                borderRadius: 2,
                textAlign: 'center',
                padding: 0,
                paddingHorizontal: 1,
              }}>
              {item.noteIds.length > 99 ? '99+' : item.noteIds.length}
            </Text>
          ) : null}
        </TouchableOpacity>
      ))}
  </View>

    
  );
};
