import { groupArray } from '@streetwriters/notesnook-core/utils/grouping';
import { qclone } from 'qclone';
import React, { useEffect, useRef, useState } from 'react';
import { db } from '../../common/database';
import { FloatingButton } from '../../components/container/floating-button';
import DelayLayout from '../../components/delay-layout';
import List from '../../components/list';
import { NotebookHeader } from '../../components/list-items/headers/notebook-header';
import { useNavigationFocus } from '../../hooks/use-navigation-focus';
import { eSendEvent, eSubscribeEvent, eUnSubscribeEvent } from '../../services/event-manager';
import Navigation, { NavigationProps, NotebookScreenParams } from '../../services/navigation';
import SearchService from '../../services/search';
import useNavigationStore from '../../stores/use-navigation-store';
import { eOnNewTopicAdded, eOpenAddNotebookDialog, eOpenAddTopicDialog } from '../../utils/events';
import { NotebookType } from '../../utils/types';

const Notebook = ({ route, navigation }: NavigationProps<'Notebook'>) => {
  const [topics, setTopics] = useState(
    groupArray(qclone(route?.params.item?.topics) || [], db.settings?.getGroupOptions('topics'))
  );
  const params = useRef<NotebookScreenParams>(route?.params);
  useNavigationFocus(navigation, {
    onFocus: () => {
      Navigation.routeNeedsUpdate(route.name, onRequestUpdate);
      syncWithNavigation();
      useNavigationStore.getState().setButtonAction(onPressFloatingButton);
      return false;
    },
    onBlur: () => false
  });

  const syncWithNavigation = () => {
    useNavigationStore.getState().update(
      {
        name: route.name,
        title: params.current?.title,
        id: params.current?.item?.id,
        type: 'notebook'
      },
      params.current?.canGoBack
    );
    SearchService.prepareSearch = prepareSearch;
  };

  const onRequestUpdate = (data?: NotebookScreenParams) => {
    if (data) params.current = data;
    params.current.title = params.current.item.title;
    try {
      let notebook = db.notebooks?.notebook(params?.current?.item?.id)?.data as NotebookType;
      if (notebook) {
        params.current.item = notebook;
        setTopics(groupArray(qclone(notebook.topics), db.settings?.getGroupOptions('topics')));
        syncWithNavigation();
      }
    } catch (e) {}
  };

  useEffect(() => {
    eSubscribeEvent(eOnNewTopicAdded, onRequestUpdate);
    return () => {
      eUnSubscribeEvent(eOnNewTopicAdded, onRequestUpdate);
    };
  }, [topics]);

  const prepareSearch = () => {
    SearchService.update({
      placeholder: `Search in "${params.current.title}"`,
      type: 'topics',
      title: params.current.title,
      get: () => {
        let notebook = db.notebooks?.notebook(params?.current?.item?.id)?.data as NotebookType;
        return notebook?.topics;
      }
    });
  };

  const onPressFloatingButton = () => {
    let n = params.current.item;
    eSendEvent(eOpenAddTopicDialog, { notebookId: n.id });
  };

  const PLACEHOLDER_DATA = {
    heading: params.current.item?.title,
    paragraph: 'You have not added any topics yet.',
    button: 'Add first topic',
    action: onPressFloatingButton,
    loading: 'Loading notebook topics'
  };

  return (
    <DelayLayout>
      <List
        listData={topics}
        type="topics"
        refreshCallback={() => {
          onRequestUpdate();
        }}
        screen="Notebook"
        headerProps={{
          heading: params.current.title
        }}
        ListHeader={
          <NotebookHeader
            onEditNotebook={() => {
              eSendEvent(eOpenAddNotebookDialog, params.current.item);
            }}
            notebook={params.current.item}
          />
        }
        placeholderData={PLACEHOLDER_DATA}
      />

      <FloatingButton title="Add new topic" onPress={onPressFloatingButton} />
    </DelayLayout>
  );
};

Notebook.navigate = (item: NotebookType, canGoBack: boolean) => {
  if (!item) return;
  Navigation.navigate<'Notebook'>(
    {
      title: item.title,
      name: 'Notebook',
      id: item.id,
      type: 'notebook'
    },
    {
      title: item.title,
      item: item,
      canGoBack
    }
  );
};

export default Notebook;
