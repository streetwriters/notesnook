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
import { VirtualizedGrouping } from "@notesnook/core";
import { Color, Note } from "@notesnook/core";
import React, { useEffect, useRef, useState } from "react";
import { db } from "../../common/database";
import { FloatingButton } from "../../components/container/floating-button";
import DelayLayout from "../../components/delay-layout";
import { Header } from "../../components/header";
import List from "../../components/list";
import { PlaceholderData } from "../../components/list/empty";
import SelectionHeader from "../../components/selection-header";
import { useNavigationFocus } from "../../hooks/use-navigation-focus";
import {
  eSubscribeEvent,
  eUnSubscribeEvent
} from "../../services/event-manager";
import Navigation, { NavigationProps } from "../../services/navigation";
import useNavigationStore, {
  HeaderRightButton,
  NotesScreenParams,
  RouteName
} from "../../stores/use-navigation-store";
import { setOnFirstSave } from "./common";
import { strings } from "@notesnook/intl";

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
}: RouteProps<"NotesPage" | "TaggedNotes" | "Monographs" | "ColoredNotes">) => {
  const params = useRef<NotesScreenParams>(route?.params);
  const [notes, setNotes] = useState<VirtualizedGrouping<Note>>();
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
  const updateOnFocus = useRef(false);
  const isFocused = useNavigationFocus(navigation, {
    onFocus: (prev) => {
      if (updateOnFocus.current) {
        onRequestUpdate();
        updateOnFocus.current = false;
      } else {
        Navigation.routeNeedsUpdate(route.name, onRequestUpdate);
      }
      syncWithNavigation();
      if (focusControl) return !prev.current;
      return false;
    },
    onBlur: () => {
      updateOnFocus.current = false;
      setOnFirstSave(null);
      return false;
    },
    focusOnInit: !focusControl
  });

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
  }, [isMonograph, route.name]);

  const onRequestUpdate = React.useCallback(
    async (data?: NotesScreenParams) => {
      if (
        useNavigationStore.getState().focusedRouteId !==
          params.current.item.id &&
        !data
      ) {
        updateOnFocus.current = false;
        return;
      }
      const isNew = data && data?.item?.id !== params.current?.item?.id;
      if (data) params.current = data;

      try {
        if (isNew) setLoadingNotes(true);
        const notes = (await get(
          params.current,
          true
        )) as VirtualizedGrouping<Note>;

        if (route.name === "TaggedNotes" || route.name === "ColoredNotes") {
          const item = await (db as any)[params.current.item.type + "s"][
            params.current.item.type
          ](params.current.item.id);

          if (!item) {
            Navigation.goBack();
            return;
          }

          params.current.item = item;
          params.current.title = item.title;
        }

        if (notes.placeholders.length === 0) setLoadingNotes(false);
        setNotes(notes);
        await notes.item(0, resolveItems);
        setLoadingNotes(false);
        syncWithNavigation();
      } catch (e) {
        console.error(e);
      }
    },
    [get, route.name, syncWithNavigation]
  );

  useEffect(() => {
    if (loadingNotes) {
      get(params.current, true)
        .then(async (items) => {
          setNotes(items as VirtualizedGrouping<Note>);
          await (items as VirtualizedGrouping<Note>).item(0, resolveItems);
          setLoadingNotes(false);
        })
        .catch((e) => {
          console.log("Error loading notes", params.current?.title, e, e.stack);
          setLoadingNotes(false);
        });
    }
  }, [loadingNotes, get]);

  useEffect(() => {
    eSubscribeEvent(route.name, onRequestUpdate);
    return () => {
      setOnFirstSave(null);
      eUnSubscribeEvent(route.name, onRequestUpdate);
    };
  }, [onRequestUpdate, route.name]);

  return (
    <>
      <SelectionHeader
        id={route.params?.item?.id}
        items={notes}
        type="note"
        renderedInRoute={route.name}
      />
      <Header
        renderedInRoute={route.name}
        title={
          route.name === "Monographs" ? strings.routes[route.name]() : title
        }
        canGoBack={params?.current?.canGoBack}
        hasSearch={true}
        id={
          route.name === "Monographs" ? "Monographs" : params?.current.item?.id
        }
        onSearch={() => {
          const selector =
            route.name === "Monographs"
              ? db.monographs.all
              : db.relations.from(params.current.item, "note").selector;

          Navigation.push("Search", {
            placeholder: strings.searchInRoute(title || route.name),
            type: "note",
            title: title,
            route: route.name,
            items: selector
          });
        }}
        accentColor={accentColor}
        onPressDefaultRightButton={onPressFloatingButton}
        headerRightButtons={rightButtons?.(params?.current)}
      />

      <DelayLayout color={accentColor} wait={loadingNotes}>
        <List
          data={notes}
          dataType="note"
          onRefresh={onRequestUpdate}
          loading={!isFocused}
          renderedInRoute={route.name}
          id={params.current.item?.id}
          headerTitle={title || "Monographs"}
          customAccentColor={accentColor}
          placeholder={placeholder}
        />

        {!isMonograph &&
        ((notes?.placeholders && (notes?.placeholders?.length || 0) > 0) ||
          isFocused) ? (
          <FloatingButton color={accentColor} onPress={onPressFloatingButton} />
        ) : null}
      </DelayLayout>
    </>
  );
};

export default NotesPage;
