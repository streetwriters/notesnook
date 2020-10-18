import React, {useCallback, useEffect} from 'react';
import {Text} from 'react-native';
import {Placeholder} from '../../components/ListPlaceholders';
import {PressableButton} from '../../components/PressableButton';
import SimpleList from '../../components/SimpleList';
import {useTracked} from '../../provider';
import {Actions} from '../../provider/Actions';
import NavigationService from '../../services/Navigation';
import {SIZE, WEIGHT} from "../../utils/SizeUtils";
import {eSendEvent} from "../../services/EventManager";
import {eUpdateSearchState} from "../../utils/Events";

export const Tags = ({route, navigation}) => {
  const [state, dispatch] = useTracked();
  const { tags} = state;


  const onFocus = useCallback(() => {
    dispatch({
      type: Actions.HEADER_STATE,
      state: true,
    });
    dispatch({
      type: Actions.HEADER_TEXT_STATE,
      state: {
        heading:"Tags",
      },
    });

    eSendEvent(eUpdateSearchState,{
      placeholder: 'Search all tags',
      data: tags,
      noSearch: false,
      type: 'tags',
      color: null,
    })
    dispatch({type: Actions.TAGS});
    dispatch({
      type: Actions.CURRENT_SCREEN,
      screen: 'tags',
    });
  }, []);

  useEffect(() => {
    navigation.addListener('focus', onFocus);
    return () => {
      navigation.removeListener('focus', onFocus);
    };
  });

  useEffect(() => {
    if (navigation.isFocused()) {
      eSendEvent(eUpdateSearchState,{
        placeholder: 'Search all tags',
        data: tags,
        noSearch: false,
        type: 'tags',
        color: null,
      })
    }
  }, [tags]);

  return (
    <SimpleList
      data={tags}
      type="tags"
      focused={() => navigation.isFocused()}
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
    <PressableButton
      onPress={() => {
        NavigationService.navigate('Notes', {
          type: 'tag',
          title: item.title,
          tag: item,
        });
      }}
      selectedColor={
        currentEditingNote === item.dateCreated || pinned
          ? colors.accent
          : colors.nav
      }
      alpha={!colors.night ? -0.02 : 0.02}
      opacity={currentEditingNote === item.dateCreated || pinned ? 0.12 : 1}
      customStyle={{
        paddingHorizontal: 12,
        height: 80,
        flexDirection: 'row',
        justifyContent: 'flex-start',
        alignItems: 'center',
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
    </PressableButton>
  );
};
