import { useIsFocused } from '@react-navigation/native';
import React, { useEffect } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { pv, SIZE, WEIGHT } from '../../common/common';
import { Placeholder } from '../../components/ListPlaceholders';
import SimpleList from '../../components/SimpleList';
import { useTracked } from '../../provider';
import { ACTIONS } from '../../provider/actions';
import NavigationService from '../../services/NavigationService';

export const Tags = ({route, navigation}) => {
  const [state, dispatch] = useTracked();
  const {colors, tags} = state;
  const isFocused = useIsFocused();

  useEffect(() => {
    if (isFocused) {
      dispatch({
        type: ACTIONS.HEADER_STATE,
        state: {
          type: 'trash',
          menu: true,
          canGoBack: false,
          route: route,
          color: null,
          navigation: navigation,
        },
      });
      dispatch({
        type: ACTIONS.CONTAINER_BOTTOM_BUTTON,
        state: {
          visible: false,
        },
      });
      dispatch({
        type: ACTIONS.HEADER_VERTICAL_MENU,
        state: false,
      });

      dispatch({
        type: ACTIONS.HEADER_TEXT_STATE,
        state: {
          heading: 'Tags',
        },
      });

      dispatch({type: ACTIONS.TAGS});
      dispatch({
        type: ACTIONS.CURRENT_SCREEN,
        screen: 'tags',
      });
    }
  }, [isFocused]);

  useEffect(() => {
    if (isFocused) {
      dispatch({
        type: ACTIONS.SEARCH_STATE,
        state: {
          placeholder: 'Search all tags',
          data: tags,
          noSearch: false,
          type: 'tags',
          color: null,
        },
      });
    }
  }, [tags, isFocused]);

  return (
    <SimpleList
      data={tags}
      type="tags"
      focused={isFocused}
      RenderItem={RenderItem}
      placeholder={<Placeholder type="tags" />}
      placeholderText="Tags added to notes appear here"
    />
  );
};

export default Tags;

const RenderItem = ({item, index}) => {
  const [state, dispatch] = useTracked();
  const {colors} = state;
  return (
    <View
    style={{
      paddingHorizontal:12
    }}
    >
    <TouchableOpacity
      key={item.title}
      onPress={() => {
        NavigationService.navigate('Notes', {
          type: 'tag',
          title: item.title,
          tag: item,
        });
      }}
      style={{
        flexDirection: 'row',
        justifyContent: 'flex-start',
        alignItems: 'center',
        margin: 0,
        paddingVertical: pv + 5,
        borderBottomWidth: 1.5,
        borderBottomColor: colors.nav,
      }}>
        
      <Text
        style={{
          fontFamily: WEIGHT.bold,
          fontSize: SIZE.md,
          color: colors.heading,
        }}>
        <Text
          style={{
            color: colors.accent,
          }}>
          #{' '}
        </Text>

        {item.title}
        {'\n'}
        <Text
          style={{
            fontSize: SIZE.xs,
            color: colors.icon,
          }}>
          {item && item.noteIds.length && item.noteIds.length > 1
            ? item.noteIds.length + ' notes'
            : item.noteIds.length === 1
            ? item.noteIds.length + ' note'
            : null}
        </Text>
      </Text>
    </TouchableOpacity>
    </View>
  );
};
