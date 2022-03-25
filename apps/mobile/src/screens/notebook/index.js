import { groupArray } from 'notes-core/utils/grouping';
import React, { useEffect, useRef, useState } from 'react';
import { FloatingButton } from '../../components/container/floating-button';
import { ContainerHeader } from '../../components/container/containerheader';
import { Header } from '../../components/header';
import SelectionHeader from '../../components/selection-header';
import List from '../../components/list';
import { NotebookHeader } from '../../components/list-items/headers/notebook-header';
import { eSendEvent, eSubscribeEvent, eUnSubscribeEvent } from '../../services/event-manager';
import Navigation from '../../services/navigation';
import SearchService from '../../services/search';
import { InteractionManager } from '../../utils';
import { db } from '../../utils/database';
import { eOnNewTopicAdded, eOpenAddNotebookDialog, eOpenAddTopicDialog } from '../../utils/events';

export const Notebook = ({ route, navigation }) => {
  const [topics, setTopics] = useState(
    groupArray(route?.params.notebook?.topics || [], db.settings.getGroupOptions('topics'))
  );
  console.log('params', route?.params.notebook?.topics);
  const params = useRef(route?.params);

  const onLoad = data => {
    if (data) params.current = data;
    try {
      let notebook = db.notebooks.notebook(params?.current?.notebook?.id)?.data;
      if (notebook) {
        params.current.notebook = notebook;
        setTopics(groupArray(notebook.topics, db.settings.getGroupOptions('topics')));
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
      title: params.current.title,
      get: () => {
        let notebook = db.notebooks.notebook(params?.current?.notebook?.id)?.data;
        return notebook.topics;
      }
    });
  };

  const _onPressBottomButton = () => {
    let n = params.current.notebook;
    eSendEvent(eOpenAddTopicDialog, { notebookId: n.id });
  };

  return (
    <>
      <SelectionHeader screen="Notebook" />

      <ContainerHeader>
        <Header
          title={params.current.title}
          isBack={!params.current.menu}
          screen="Notebook"
          action={_onPressBottomButton}
        />
      </ContainerHeader>
      <List
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
        ListHeader={
          <NotebookHeader
            onEditNotebook={() => {
              eSendEvent(eOpenAddNotebookDialog, params.current.notebook);
            }}
            onPress={_onPressBottomButton}
            notebook={params.current.notebook}
          />
        }
        focused={() => navigation.isFocused()}
        placeholderData={{
          heading: params.current.notebook.title,
          paragraph: 'You have not added any topics yet.',
          button: 'Add first topic',
          action: _onPressBottomButton,
          loading: 'Loading notebook topics'
        }}
      />

      <FloatingButton title="Add new topic" onPress={_onPressBottomButton} />
    </>
  );
};

export default Notebook;
