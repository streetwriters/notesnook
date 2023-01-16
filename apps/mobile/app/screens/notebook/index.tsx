/*
This file is part of the Notesnook project (https://notesnook.com/)

Copyright (C) 2023 Streetwriters (Private) Limited

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

import { groupArray } from "@notesnook/core/utils/grouping";
import qclone from "qclone";
import React, { useEffect, useRef, useState } from "react";
import { db } from "../../common/database";
import { FloatingButton } from "../../components/container/floating-button";
import DelayLayout from "../../components/delay-layout";
import List from "../../components/list";
import { NotebookHeader } from "../../components/list-items/headers/notebook-header";
import { useNavigationFocus } from "../../hooks/use-navigation-focus";
import {
  eSendEvent,
  eSubscribeEvent,
  eUnSubscribeEvent
} from "../../services/event-manager";
import Navigation, { NavigationProps } from "../../services/navigation";
import SearchService from "../../services/search";
import useNavigationStore, {
  NotebookScreenParams
} from "../../stores/use-navigation-store";
import {
  eOnNewTopicAdded,
  eOpenAddNotebookDialog,
  eOpenAddTopicDialog
} from "../../utils/events";
import { NotebookType } from "../../utils/types";
const Notebook = ({ route, navigation }: NavigationProps<"Notebook">) => {
  const [topics, setTopics] = useState(
    groupArray(
      qclone(route?.params.item?.topics) || [],
      db.settings?.getGroupOptions("topics")
    )
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

  const syncWithNavigation = React.useCallback(() => {
    useNavigationStore.getState().update(
      {
        name: route.name,
        title: params.current?.title,
        id: params.current?.item?.id,
        type: "notebook"
      },
      params.current?.canGoBack
    );
    SearchService.prepareSearch = prepareSearch;
  }, [route.name]);

  const onRequestUpdate = React.useCallback(
    (data?: NotebookScreenParams) => {
      if (data) params.current = data;
      params.current.title = params.current.item.title;
      try {
        const notebook = db.notebooks?.notebook(params?.current?.item?.id)
          ?.data as NotebookType;
        if (notebook) {
          params.current.item = notebook;
          setTopics(
            groupArray(
              qclone(notebook.topics),
              db.settings?.getGroupOptions("topics")
            )
          );
          syncWithNavigation();
        }
      } catch (e) {
        console.error(e);
      }
    },
    [syncWithNavigation]
  );

  useEffect(() => {
    eSubscribeEvent(eOnNewTopicAdded, onRequestUpdate);
    return () => {
      eUnSubscribeEvent(eOnNewTopicAdded, onRequestUpdate);
    };
  }, [onRequestUpdate, topics]);

  const prepareSearch = () => {
    SearchService.update({
      placeholder: `Search in "${params.current.title}"`,
      type: "topics",
      title: params.current.title,
      get: () => {
        const notebook = db.notebooks?.notebook(params?.current?.item?.id)
          ?.data as NotebookType;
        return notebook?.topics;
      }
    });
  };

  const onPressFloatingButton = () => {
    const n = params.current.item;
    eSendEvent(eOpenAddTopicDialog, { notebookId: n.id });
  };

  const PLACEHOLDER_DATA = {
    heading: params.current.item?.title,
    paragraph: "You have not added any topics yet.",
    button: "Add first topic",
    action: onPressFloatingButton,
    loading: "Loading notebook topics"
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
        loading={false}
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
  Navigation.navigate<"Notebook">(
    {
      title: item.title,
      name: "Notebook",
      id: item.id,
      type: "notebook"
    },
    {
      title: item.title,
      item: item,
      canGoBack
    }
  );
};

export default Notebook;
