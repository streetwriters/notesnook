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

import {
  Color,
  GroupedItems,
  Item,
  Note,
  Topic
} from "@notesnook/core/dist/types";
import React, { useEffect, useRef, useState } from "react";
import { View } from "react-native";
import { db } from "../../common/database";
import { FloatingButton } from "../../components/container/floating-button";
import DelayLayout from "../../components/delay-layout";
import List from "../../components/list";
import { IconButton } from "../../components/ui/icon-button";
import Paragraph from "../../components/ui/typography/paragraph";
import { useNavigationFocus } from "../../hooks/use-navigation-focus";
import {
  eSubscribeEvent,
  eUnSubscribeEvent
} from "../../services/event-manager";
import Navigation, { NavigationProps } from "../../services/navigation";
import SearchService from "../../services/search";
import useNavigationStore, {
  HeaderRightButton,
  NotesScreenParams,
  RouteName
} from "../../stores/use-navigation-store";
import { useNoteStore } from "../../stores/use-notes-store";
import { SIZE } from "../../utils/size";

import NotebookScreen from "../notebook/index";
import {
  openEditor,
  openMonographsWebpage,
  setOnFirstSave,
  toCamelCase
} from "./common";
import { PlaceholderData } from "../../components/list/empty";
import { VirtualizedGrouping } from "@notesnook/core";
export const WARNING_DATA = {
  title: "Some notes in this topic are not synced"
};

export const PLACEHOLDER_DATA = {
  title: "Your notes",
  paragraph: "You have not added any notes yet.",
  button: "Add your first Note",
  action: openEditor,
  loading: "Loading your notes."
};

export const MONOGRAPH_PLACEHOLDER_DATA = {
  heading: "Your monographs",
  paragraph: "You have not published any notes as monographs yet.",
  button: "Learn more about monographs",
  action: openMonographsWebpage,
  loading: "Loading published notes.",
  type: "monographs",
  buttonIcon: "information-outline"
};

export interface RouteProps<T extends RouteName> extends NavigationProps<T> {
  get: (
    params: NotesScreenParams,
    grouped?: boolean
  ) => Promise<VirtualizedGrouping<Note> | Note[]>;
  placeholder: PlaceholderData;
  onPressFloatingButton: () => void;
  focusControl?: boolean;
  canGoBack?: boolean;
  rightButtons?: (params: NotesScreenParams) => HeaderRightButton[];
}

function getItemType(routeName: RouteName) {
  if (routeName === "TaggedNotes") return "tag";
  if (routeName === "ColoredNotes") return "color";
  if (routeName === "TopicNotes") return "topic";
  if (routeName === "Monographs") return "monograph";
  return "note";
}

const NotesPage = ({
  route,
  navigation,
  get,
  placeholder,
  onPressFloatingButton,
  focusControl = true,
  rightButtons
}: RouteProps<
  "NotesPage" | "TaggedNotes" | "Monographs" | "ColoredNotes" | "TopicNotes"
>) => {
  const params = useRef<NotesScreenParams>(route?.params);

  const [notes, setNotes] = useState<VirtualizedGrouping<Note>>();

  const loading = useNoteStore((state) => state.loading);
  const [loadingNotes, setLoadingNotes] = useState(true);
  const isMonograph = route.name === "Monographs";

  // const notebook =
  //   route.name === "TopicNotes" &&
  //   params.current.item.type === "topic" &&
  //   params.current.item.notebookId
  //     ? db.notebooks?.notebook((params.current.item as Topic).notebookId)?.data
  //     : null;

  const isFocused = useNavigationFocus(navigation, {
    onFocus: (prev) => {
      Navigation.routeNeedsUpdate(route.name, onRequestUpdate);
      syncWithNavigation();
      if (focusControl) return !prev.current;
      return false;
    },
    onBlur: () => {
      setOnFirstSave(null);
      return false;
    },
    focusOnInit: !focusControl
  });

  const prepareSearch = React.useCallback(() => {
    const { item } = params.current;
    SearchService.update({
      placeholder: `Search in ${item.title}`,
      type: "notes",
      title:
        item.type === "tag"
          ? "#" + item.title
          : toCamelCase((item as Color).title),
      get: () => {
        return get(params.current, false);
      }
    });
  }, [get]);

  const syncWithNavigation = React.useCallback(() => {
    const { item, title } = params.current;
    useNavigationStore.getState().update(
      {
        name: route.name,
        title:
          route.name === "ColoredNotes" ? toCamelCase(title as string) : title,
        id: item?.id,
        type: "notes",
        notebookId: item.type === "topic" ? item.notebookId : undefined,
        color:
          item.type === "color" && route.name === "ColoredNotes"
            ? item.title?.toLowerCase()
            : undefined
      },
      params.current.canGoBack,
      rightButtons && rightButtons(params.current)
    );
    SearchService.prepareSearch = prepareSearch;
    useNavigationStore.getState().setButtonAction(onPressFloatingButton);

    !isMonograph &&
      setOnFirstSave({
        type: getItemType(route.name),
        id: item.id,
        notebook: item.type === "topic" ? item.notebookId : undefined
      });
  }, [
    isMonograph,
    onPressFloatingButton,
    prepareSearch,
    rightButtons,
    route.name
  ]);

  const onRequestUpdate = React.useCallback(
    async (data?: NotesScreenParams) => {
      const isNew = data && data?.item?.id !== params.current?.item?.id;
      if (data) params.current = data;
      params.current.title =
        params.current.title ||
        (params.current.item as Item & { title: string }).title;
      const { item } = params.current;
      try {
        if (isNew) setLoadingNotes(true);
        const notes = (await get(
          params.current,
          true
        )) as VirtualizedGrouping<Note>;

        if (
          ((item.type === "tag" || item.type === "color") &&
            (!notes || notes.ids.length === 0)) ||
          (item.type === "topic" && !notes)
        ) {
          return Navigation.goBack();
        }
        if (notes.ids.length === 0) setLoadingNotes(false);
        setNotes(notes);
        syncWithNavigation();
      } catch (e) {
        console.error(e);
      }
    },
    [get, syncWithNavigation]
  );

  useEffect(() => {
    if (loadingNotes && !loading) {
      get(params.current, true)
        .then((items) => {
          setNotes(items as VirtualizedGrouping<Note>);
          setLoadingNotes(false);
        })
        .catch((e) => {
          console.log("Error loading notes", params.current?.title, e, e.stack);
          setLoadingNotes(false);
        });
    }
  }, [loadingNotes, loading, get]);

  useEffect(() => {
    eSubscribeEvent(route.name, onRequestUpdate);
    return () => {
      setOnFirstSave(null);
      eUnSubscribeEvent(route.name, onRequestUpdate);
    };
  }, [onRequestUpdate, route.name]);

  return (
    <DelayLayout
      color={
        route.name === "ColoredNotes"
          ? (params.current?.item as Color)?.colorCode
          : undefined
      }
      wait={loading || loadingNotes}
    >
      {/* {route.name === "TopicNotes" ? (
        <View
          style={{
            width: "100%",
            paddingHorizontal: 12,
            flexDirection: "row",
            alignItems: "center"
          }}
        >
          <Paragraph
            onPress={() => {
              Navigation.navigate({
                name: "Notebooks",
                title: "Notebooks"
              });
            }}
            size={SIZE.xs}
          >
            Notebooks
          </Paragraph>
          {notebook ? (
            <>
              <IconButton
                name="chevron-right"
                size={14}
                customStyle={{ width: 25, height: 25 }}
              />
              <Paragraph
                onPress={() => {
                  NotebookScreen.navigate(notebook, true);
                }}
                size={SIZE.xs}
              >
                {notebook.title}
              </Paragraph>
            </>
          ) : null}
        </View>
      ) : null} */}
      <List
        data={notes}
        dataType="note"
        onRefresh={onRequestUpdate}
        loading={loading || !isFocused}
        renderedInRoute="Notes"
        headerTitle={params.current.title}
        customAccentColor={
          route.name === "ColoredNotes"
            ? (params.current?.item as Color)?.colorCode
            : undefined
        }
        placeholder={placeholder}
      />

      {!isMonograph &&
      ((notes?.ids && (notes?.ids?.length || 0) > 0) || isFocused) ? (
        <FloatingButton
          color={
            route.name === "ColoredNotes"
              ? (params.current?.item as Color)?.colorCode
              : undefined
          }
          title="Create a note"
          onPress={onPressFloatingButton}
        />
      ) : null}
    </DelayLayout>
  );
};

export default NotesPage;
