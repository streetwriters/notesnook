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
import { resolveItems } from "@notesnook/common";
import { Note, Notebook, VirtualizedGrouping } from "@notesnook/core";
import { strings } from "@notesnook/intl";
import React, { useEffect, useRef, useState } from "react";
import { View } from "react-native";
import { db } from "../../common/database";
import { FloatingButton } from "../../components/container/floating-button";
import DelayLayout from "../../components/delay-layout";
import { Header } from "../../components/header";
import List from "../../components/list";
import { NotebookHeader } from "../../components/list-items/headers/notebook-header";
import { Properties } from "../../components/properties";
import SelectionHeader from "../../components/selection-header";
import { AddNotebookSheet } from "../../components/sheets/add-notebook";
import { IconButton } from "../../components/ui/icon-button";
import { Pressable } from "../../components/ui/pressable";
import Paragraph from "../../components/ui/typography/paragraph";
import { useNavigationFocus } from "../../hooks/use-navigation-focus";
import { eSendEvent, eSubscribeEvent } from "../../services/event-manager";
import Navigation, { NavigationProps } from "../../services/navigation";
import useNavigationStore, {
  NotebookScreenParams
} from "../../stores/use-navigation-store";
import { eUpdateNotebookRoute } from "../../utils/events";
import { findRootNotebookId } from "../../utils/notebooks";
import { SIZE } from "../../utils/size";
import { DefaultAppStyles } from "../../utils/styles";
import { openEditor, setOnFirstSave } from "../notes/common";

const NotebookScreen = ({ route, navigation }: NavigationProps<"Notebook">) => {
  const [notes, setNotes] = useState<VirtualizedGrouping<Note>>();
  const params = useRef<NotebookScreenParams>(route?.params);
  const [loading, setLoading] = useState(true);
  const updateOnFocus = useRef(false);
  const [breadcrumbs, setBreadcrumbs] = useState<
    {
      id: string;
      title: string;
    }[]
  >([]);

  useNavigationFocus(navigation, {
    onFocus: () => {
      if (updateOnFocus.current) {
        onRequestUpdate();
        updateOnFocus.current = false;
      } else {
        Navigation.routeNeedsUpdate(route.name, onRequestUpdate);
      }
      syncWithNavigation();
      return false;
    },
    onBlur: () => {
      updateOnFocus.current = false;
      setOnFirstSave(null);
      return false;
    }
  });

  const syncWithNavigation = React.useCallback(() => {
    useNavigationStore.getState().setFocusedRouteId(params?.current?.item?.id);
    setOnFirstSave({
      type: "notebook",
      id: params.current.item.id
    });
  }, []);

  const onRequestUpdate = React.useCallback(
    async (data?: NotebookScreenParams) => {
      if (
        useNavigationStore.getState().focusedRouteId !==
          params.current.item.id &&
        !data
      ) {
        updateOnFocus.current = true;
        return;
      }

      if (data?.item?.id && params.current.item?.id !== data?.item?.id) {
        const nextRootNotebookId = await findRootNotebookId(data?.item?.id);
        const currentNotebookRoot = await findRootNotebookId(
          params.current.item.id
        );

        if (
          nextRootNotebookId !== currentNotebookRoot ||
          nextRootNotebookId === params.current?.item?.id
        ) {
          // Never update notebook in route if root is different or if the root is current notebook.
          return;
        }
      }

      if (data) params.current = data;
      params.current.title = params.current.item.title;

      try {
        const notebook = await db.notebooks?.notebook(
          params?.current?.item?.id
        );

        if (notebook) {
          const breadcrumbs = await db.notebooks.breadcrumbs(notebook.id);
          setBreadcrumbs(breadcrumbs.slice(0, breadcrumbs.length - 1));
          params.current.item = notebook;
          const notes = await db.relations
            .from(notebook, "note")
            .selector.grouped(db.settings.getGroupOptions("notes"));
          setNotes(notes);
          await notes.item(0, resolveItems);
          syncWithNavigation();
        } else {
          Navigation.goBack();
        }
        setLoading(false);
      } catch (e) {
        console.error(e);
      }
    },
    [syncWithNavigation]
  );

  useEffect(() => {
    onRequestUpdate(params.current);
    const sub = eSubscribeEvent(eUpdateNotebookRoute, onRequestUpdate);
    return () => {
      sub?.unsubscribe();
    };
  }, [onRequestUpdate]);

  useEffect(() => {
    return () => {
      setOnFirstSave(null);
    };
  }, []);

  return (
    <>
      <SelectionHeader
        id={route.params?.item?.id}
        items={notes}
        type="note"
        renderedInRoute="Notebook"
      />
      <Header
        renderedInRoute={route.name}
        title={params.current.item?.title}
        canGoBack={params?.current?.canGoBack}
        rightButton={{
          name: "dots-vertical",
          onPress: () => {
            Properties.present(params.current.item);
          }
        }}
        hasSearch={true}
        onSearch={() => {
          const selector = db.relations.from(
            params.current.item,
            "note"
          ).selector;
          Navigation.push("Search", {
            placeholder: strings.searchInRoute(params.current.item?.title),
            type: "note",
            title: params.current.item?.title,
            route: route.name,
            items: selector
          });
        }}
        id={params.current.item?.id}
      />

      {breadcrumbs && breadcrumbs.length > 0 ? (
        <View
          style={{
            width: "100%",
            paddingHorizontal: DefaultAppStyles.GAP,
            flexDirection: "row",
            alignItems: "center",
            flexWrap: "wrap",
            marginTop: DefaultAppStyles.GAP_VERTICAL
          }}
        >
          <IconButton
            name="notebook-outline"
            size={16}
            style={{ width: 20, height: 25 }}
            onPress={() => {
              Navigation.push("Notebooks", {
                canGoBack: true
              });
            }}
          />

          {breadcrumbs.map((item) => (
            <Pressable
              onPress={async () => {
                const notebook = await db.notebooks.notebook(item.id);
                if (!notebook) return;
                NotebookScreen.navigate(notebook, true);
              }}
              key={item.id}
              style={{
                width: undefined,
                flexDirection: "row",
                paddingHorizontal: 0,
                alignItems: "center"
              }}
            >
              <IconButton
                name="chevron-right"
                size={16}
                top={0}
                left={0}
                right={0}
                bottom={0}
                style={{ width: 20, height: 25 }}
              />
              <Paragraph size={SIZE.xs + 1}>{item.title}</Paragraph>
            </Pressable>
          ))}
        </View>
      ) : null}

      <DelayLayout wait={loading}>
        <List
          data={notes}
          dataType="note"
          onRefresh={() => {
            onRequestUpdate();
          }}
          id={params.current.item?.id}
          renderedInRoute="Notebook"
          headerTitle={params.current.title}
          loading={loading}
          CustomLisHeader={
            <NotebookHeader
              onEditNotebook={() => {
                AddNotebookSheet.present(params.current.item);
              }}
              notebook={params.current.item}
              totalNotes={notes?.placeholders.length || 0}
            />
          }
          placeholder={{
            title: params.current.item?.title,
            paragraph: strings.notesEmpty(),
            button: strings.addFirstNote(),
            action: openEditor,
            loading: strings.loadingNotes()
          }}
        />
      </DelayLayout>
      <FloatingButton onPress={openEditor} />
    </>
  );
};

NotebookScreen.navigate = async (item: Notebook, canGoBack?: boolean) => {
  if (!item) return;
  const { currentRoute, focusedRouteId } = useNavigationStore.getState();
  if (currentRoute === "Notebooks") {
    Navigation.push("Notebook", {
      title: item.title,
      item: item,
      canGoBack
    });
  } else if (currentRoute === "Notebook") {
    if (!focusedRouteId) return;
    const rootNotebookId = await findRootNotebookId(focusedRouteId);
    const currentNotebookRoot = await findRootNotebookId(item?.id);

    if (
      (rootNotebookId === currentNotebookRoot &&
        focusedRouteId !== rootNotebookId) ||
      focusedRouteId == item?.id
    ) {
      // Update the route in place instead

      eSendEvent(eUpdateNotebookRoute, {
        item: item,
        title: item.title,
        canGoBack: canGoBack
      });
    } else {
      // Push a new route
      Navigation.push("Notebook", {
        title: item.title,
        item: item,
        canGoBack
      });
    }
  } else {
    // Push a new route anyways
    Navigation.push("Notebook", {
      title: item.title,
      item: item,
      canGoBack
    });
  }
};

export default NotebookScreen;
