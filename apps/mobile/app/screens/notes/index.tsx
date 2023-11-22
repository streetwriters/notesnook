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

import { VirtualizedGrouping } from "@notesnook/core";
import { Color, Note } from "@notesnook/core/dist/types";
import React, { useEffect, useRef, useState } from "react";
import { FloatingButton } from "../../components/container/floating-button";
import DelayLayout from "../../components/delay-layout";
import { Header } from "../../components/header";
import List from "../../components/list";
import { PlaceholderData } from "../../components/list/empty";
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
import { setOnFirstSave } from "./common";
export const WARNING_DATA = {
  title: "Some notes in this topic are not synced"
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
  const title =
    params.current?.item.type === "tag"
      ? "#" + params.current?.item.title
      : params.current?.item.title;
  const accentColor =
    route.name === "ColoredNotes"
      ? (params.current?.item as Color)?.colorCode
      : undefined;

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
      title: item.type === "tag" ? "#" + item.title : item.title,
      get: () => {
        return get(params.current, false);
      }
    });
  }, [get]);

  const syncWithNavigation = React.useCallback(() => {
    const { item } = params.current;

    useNavigationStore
      .getState()
      .setFocusedRouteId(params?.current?.item?.id || route.name);

    !isMonograph &&
      setOnFirstSave({
        type: getItemType(route.name),
        id: item.id
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
      const { item } = params.current;
      try {
        if (isNew) setLoadingNotes(true);
        const notes = (await get(
          params.current,
          true
        )) as VirtualizedGrouping<Note>;

        if (
          (item.type === "tag" || item.type === "color") &&
          (!notes || notes.ids.length === 0)
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
    <>
      <Header
        renderedInRoute={route.name}
        title={title}
        canGoBack={params?.current?.canGoBack}
        hasSearch={true}
        id={
          route.name === "Monographs" ? "Monographs" : params?.current.item?.id
        }
        onSearch={() => {
          Navigation.push("Search", {
            placeholder: `Type a keyword to search in ${title}`,
            type: "note",
            title: title,
            route: route.name,
            ids: notes?.ids?.filter((id) => typeof id === "string") as string[]
          });
        }}
        accentColor={accentColor}
        onPressDefaultRightButton={onPressFloatingButton}
        headerRightButtons={rightButtons?.(params?.current)}
      />

      <DelayLayout color={accentColor} wait={loading || loadingNotes}>
        <List
          data={notes}
          dataType="note"
          onRefresh={onRequestUpdate}
          loading={loading || !isFocused}
          renderedInRoute="Notes"
          headerTitle={title}
          customAccentColor={accentColor}
          placeholder={placeholder}
        />

        {!isMonograph &&
        ((notes?.ids && (notes?.ids?.length || 0) > 0) || isFocused) ? (
          <FloatingButton
            color={accentColor}
            title="Create a note"
            onPress={onPressFloatingButton}
          />
        ) : null}
      </DelayLayout>
    </>
  );
};

export default NotesPage;
