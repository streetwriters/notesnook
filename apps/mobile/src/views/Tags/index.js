import React, { useCallback, useEffect } from 'react';
import { Placeholder } from '../../components/ListPlaceholders';
import SimpleList from '../../components/SimpleList';
import { useTracked } from '../../provider';
import { Actions } from '../../provider/Actions';
import { eSendEvent } from '../../services/EventManager';
import SearchService from '../../services/SearchService';
import { eScrollEvent } from '../../utils/Events';

export const Tags = ({route, navigation}) => {
  const [state, dispatch] = useTracked();
  const {tags} = state;

  const onFocus = useCallback(() => {
    eSendEvent(eScrollEvent, {name:'Tags', type: 'in'});
    dispatch({
      type: Actions.HEADER_STATE,
      state: true,
    });
    dispatch({
      type: Actions.HEADER_TEXT_STATE,
      state: {
        heading: 'Tags',
      },
    });

    dispatch({
      type: Actions.CONTAINER_BOTTOM_BUTTON,
      state: {
        onPress:null
      },
    });

    updateSearch();
    dispatch({type: Actions.TAGS});
    dispatch({
      type: Actions.CURRENT_SCREEN,
      screen: 'tags',
    });
  }, []);

  useEffect(() => {
    navigation.addListener('focus', onFocus);
    return () => {
      eSendEvent(eScrollEvent, {name:'Tags', type: 'back'});
      navigation.removeListener('focus', onFocus);
    };
  },[]);


  useEffect(() => {
    if (navigation.isFocused()) {
      updateSearch();
    }
  }, [tags]);


  const updateSearch = () => {
    SearchService.update({
      placeholder: 'Search in tags',
      data: tags,
      type: 'tags',
    });
  };


  return (
    <SimpleList
      data={tags}
      type="tags"
      focused={() => navigation.isFocused()}
      placeholderData={{
        heading:"Your Tags",
        paragraph:"You have not created any tags for your notes yet.",
        button:null,
      }}
      placeholder={<Placeholder type="tags" />}
      placeholderText="Tags added to notes appear here"
    />
  );
};

export default Tags;


