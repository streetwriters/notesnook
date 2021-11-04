import { groupArray } from 'notes-core/utils/grouping';
import React, { useEffect, useRef, useState } from 'react';
import { ContainerBottomButton } from '../../components/Container/ContainerBottomButton';
import { ContainerTopSection } from '../../components/Container/ContainerTopSection';
import { Header } from '../../components/Header';
import SelectionHeader from '../../components/SelectionHeader';
import SimpleList from '../../components/SimpleList';
import {
  eSendEvent,
  eSubscribeEvent,
  eUnSubscribeEvent
} from '../../services/EventManager';
import Navigation from '../../services/Navigation';
import SearchService from '../../services/SearchService';
import { InteractionManager } from '../../utils';
import { db } from '../../utils/database';
import {
  eOnNewTopicAdded,
  eOpenAddNotebookDialog,
  eOpenAddTopicDialog
} from '../../utils/Events';

export const Notebook = ({route, navigation}) => {
  const [topics, setTopics] = useState(
    groupArray(
      route?.params.notebook?.topics || [],
      db.settings.getGroupOptions('topics')
    )
  );
  const params = useRef(route?.params);

  const onLoad = data => {
    if (data) params.current = data;
    try {
      let notebook = db.notebooks.notebook(params?.current?.notebook?.id)?.data;
      if (notebook) {
        params.current.notebook = notebook;
        setTopics(
          groupArray(notebook.topics, db.settings.getGroupOptions('topics'))
        );
        params.current.title = params.current.notebook.title;
      }
      updateSearch();
    } catch (e) {}
  };

  useEffect(() => {
    eSubscribeEvent(eOnNewTopicAdded, onLoad);
    return () => {
      eUnSubscribeEvent(eOnNewTopicAdded, onLoad);
    };
  }, []);

  const onFocus = async () => {
    InteractionManager.runAfterInteractions(() => {
      Navigation.routeNeedsUpdate(Navigation.routeNames.Notebook, onLoad);
    }, 150);
    Navigation.setHeaderState('Notebook', params, {
      heading: params.current.title,
      id: params.current.notebook.id,
      type: 'notebook'
    });
  };

  useEffect(() => {
    navigation.addListener('focus', onFocus);
    return () => {
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
      placeholder: `Search in "${params.current.title}"`,
      data: topics,
      type: 'topics',
      title: params.current.title
    });
  };

  const _onPressBottomButton = () => {
    let n = params.current.notebook;
    eSendEvent(eOpenAddTopicDialog, {notebookId: n.id});
  };

  return (
    <>
      <SelectionHeader screen="Notebook" />
      <ContainerTopSection>
        <Header
          title={params.current.title}
          isBack={!params.current.menu}
          screen="Notebook"
          action={_onPressBottomButton}
          rightButtons={[
            {
              icon: 'pencil',
              title: 'Edit notebook',
              func: () =>
                eSendEvent(eOpenAddNotebookDialog, params.current.notebook)
            }
          ]}
        />
      </ContainerTopSection>
      <SimpleList
        listData={topics}
        type="topics"
        refreshCallback={() => {
          onLoad();
        }}
        screen="Notebook"
        headerProps={{
          heading: params.current.title,
          paragraph: 'Edit notebook',
          onPress: () => {
            eSendEvent(eOpenAddNotebookDialog, params.current.notebook);
          },
          icon: 'pencil'
        }}
        focused={() => navigation.isFocused()}
        placeholderData={{
          heading: params.current.notebook.title,
          paragraph: 'You have not added any topics yet.',
          button: 'Add a topic',
          action: _onPressBottomButton,
          loading: 'Loading notebook topics'
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
