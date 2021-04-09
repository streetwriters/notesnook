import React, {useEffect, useState} from 'react';
import {ContainerBottomButton} from '../../components/Container/ContainerBottomButton';
import SimpleList from '../../components/SimpleList';
import {
  eSendEvent,
  eSubscribeEvent,
  eUnSubscribeEvent,
} from '../../services/EventManager';
import Navigation from '../../services/Navigation';
import SearchService from '../../services/SearchService';
import {InteractionManager} from '../../utils';
import {db} from '../../utils/DB';
import {
  eOnNewTopicAdded,
  eOpenAddNotebookDialog,
  eOpenAddTopicDialog,
  eScrollEvent,
} from '../../utils/Events';
import {sleep} from '../../utils/TimeUtils';

export const Notebook = ({route, navigation}) => {
  const [topics, setTopics] = useState(route.params.notebook.topics);
  const [loading, setLoading] = useState(true);
  let params = route.params;
  let pageIsLoaded = false;

  let ranAfterInteractions = false;

  const runAfterInteractions = (time = 150) => {
    InteractionManager.runAfterInteractions(() => {
      let notebook = db.notebooks.notebook(params.notebook?.id).data;
      params.notebook = notebook;
      params.title = params.notebook.title;
      setTopics(notebook.topics);
      setTimeout(() => {
        if (loading) {
          setLoading(false);
        }
      },10)
      Navigation.routeNeedsUpdate('Notebook', () => {
        onLoad();
      });
      eSendEvent(eScrollEvent, {name: params.title, type: 'in'});
      if (params.menu) {
        navigation.setOptions({
          animationEnabled: false,
          gestureEnabled: false,
        });
      } else {
        navigation.setOptions({
          animationEnabled: true,
          gestureEnabled: Platform.OS === 'ios',
        });
      }
      updateSearch();
      ranAfterInteractions = false;
    }, time);
  };
  const onLoad = (data) => {
    if (data) {
      setLoading(true);
      params = data;
    }

    runAfterInteractions(data ? 150 : 1);
  };

  useEffect(() => {
    eSubscribeEvent(eOnNewTopicAdded, onLoad);
    return () => {
      eUnSubscribeEvent(eOnNewTopicAdded, onLoad);
    };
  }, []);

  const onFocus = async () => {
    if (!ranAfterInteractions) {
      ranAfterInteractions = true;
      runAfterInteractions();
    }

    if (!pageIsLoaded) {
      pageIsLoaded = true;
      return;
    }
    Navigation.setHeaderState('Notebooks', params, {
      heading: params.title,
      id: params.notebook.id,
      type: 'notebook',
    });
  };

  useEffect(() => {
    if (!ranAfterInteractions) {
      ranAfterInteractions = true;
      runAfterInteractions();
    }

    navigation.addListener('focus', onFocus);
    return () => {
      ranAfterInteractions = false;
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
      title: params.title,
    });
  };

  const _onPressBottomButton = () => {
    let n = params.notebook;
    eSendEvent(eOpenAddTopicDialog, {notebookId: n.id});
  };

  return (
    <>
      <SimpleList
        listData={topics}
        type="topics"
        refreshCallback={() => {
          onLoad();
        }}
        headerProps={{
          heading: params.title,
          paragraph: 'Edit notebook',
          onPress: () => {
            eSendEvent(eOpenAddNotebookDialog, params.notebook);
          },
          icon: 'pencil',
        }}
        loading={loading}
        focused={() => navigation.isFocused()}
        placeholderData={{
          heading: params.notebook.title,
          paragraph: 'You have not added any topics yet.',
          button: 'Add a topic',
          action: _onPressBottomButton,
          loading: 'Loading notebook topics',
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
