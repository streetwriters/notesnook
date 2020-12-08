import React, { useEffect, useState } from 'react';
import { ContainerBottomButton } from '../../components/Container/ContainerBottomButton';
import { AddTopicEvent } from '../../components/DialogManager/recievers';
import SimpleList from '../../components/SimpleList';
import { useTracked } from '../../provider';
import {
  eSendEvent,
  eSubscribeEvent,
  eUnSubscribeEvent
} from '../../services/EventManager';
import Navigation from '../../services/Navigation';
import SearchService from '../../services/SearchService';
import { db } from '../../utils/DB';
import { eOnNewTopicAdded, eScrollEvent } from '../../utils/Events';

export const Notebook = ({route, navigation}) => {
  const [, dispatch] = useTracked();
  const [topics, setTopics] = useState(route.params.notebook.topics);
  let params = route.params;
  let pageIsLoaded = false;

  const onLoad = () => {
    setTopics(db.notebooks.notebook(route.params.notebook.id).data.topics);
  };

  useEffect(() => {
    onLoad();
  }, [route.params]);

  useEffect(() => {
    eSubscribeEvent(eOnNewTopicAdded, onLoad);
    return () => {
      eUnSubscribeEvent(eOnNewTopicAdded, onLoad);
    };
  }, []);

  const onFocus = async () => {
    eSendEvent(eScrollEvent, {name: params.title, type: 'in'});
    updateSearch();
    if (!pageIsLoaded) {
      console.log('returning since page is not loaded');
      pageIsLoaded = true;
      return;
    }
    Navigation.setHeaderState('notebooks', params, {
      heading: params.title,
      id: params.notebook.id,
      type: 'notebook',
    });
  };

  useEffect(() => {
    navigation.addListener('focus', onFocus);
    return () => {
      eSendEvent(eScrollEvent, {name: params.title, type: 'back'});
      navigation.removeListener('focus', onFocus);
    };
  }, []);

  useEffect(() => {
    if (navigation.isFocused()) {
      updateSearch();
    }
  }, [topics]);

  const updateSearch = () => {
    SearchService.update({
      placeholder: `Search in "${params.title}"`,
      data: topics,
      type: 'topics',
    });
  };

  const _onPressBottomButton = () => {
    let n = route.params.notebook;
    AddTopicEvent(n);
  };

  return (
    <>
      <SimpleList
        data={topics}
        type="topics"
        refreshCallback={() => {
          onLoad();
        }}
        headerProps={{
          heading: params.title,
        }}
        focused={() => navigation.isFocused()}
        placeholderData={{
          heading: route.params.notebook.title,
          paragraph: 'You have not added any topics yet.',
          button: 'Add a Topic',
          action: _onPressBottomButton,
        }}
      />

      <ContainerBottomButton
        title="Add new topic"
        onPress={_onPressBottomButton}
      />
    </>
  );
};

export default Notebook;
