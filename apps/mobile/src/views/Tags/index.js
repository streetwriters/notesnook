import React, {useCallback, useEffect} from 'react';
import {Placeholder} from '../../components/ListPlaceholders';
import SimpleList from '../../components/SimpleList';
import {useTracked} from '../../provider';
import {Actions} from '../../provider/Actions';
import {DDS} from '../../services/DeviceDetection';
import {eSendEvent} from '../../services/EventManager';
import Navigation from '../../services/Navigation';
import SearchService from '../../services/SearchService';
import {eScrollEvent} from '../../utils/Events';

export const Tags = ({route, navigation}) => {
  const [state, dispatch] = useTracked();
  const {tags} = state;
  let pageIsLoaded = false;

  const onFocus = useCallback(() => {
    eSendEvent(eScrollEvent, {name: 'Tags', type: 'in'});
    if (DDS.isLargeTablet()) {
      dispatch({
        type: Actions.CONTAINER_BOTTOM_BUTTON,
        state: {
          onPress: null,
        },
      });
    }
    updateSearch();
    if (!pageIsLoaded) {
      pageIsLoaded = true;
      return;
    }
    Navigation.setHeaderState(
      'Tags',
      {
        menu: true,
      },
      {
        heading: 'Tags',
        id: 'tags_navigation',
      },
    );
  }, []);

  useEffect(() => {
    navigation.addListener('focus', onFocus);
    return () => {
      pageIsLoaded = false;
      eSendEvent(eScrollEvent, {name: 'Tags', type: 'back'});
      navigation.removeListener('focus', onFocus);
    };
  }, []);

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
        heading: 'Your Tags',
        paragraph: 'You have not created any tags for your notes yet.',
        button: null,
      }}
      placeholder={<Placeholder type="tags" />}
      placeholderText="Tags added to notes appear here"
    />
  );
};

export default Tags;
