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

import { Item, Note, VirtualizedGrouping } from "@notesnook/core";
import React, { useEffect, useRef, useState } from "react";
import { DatabaseLogger, db } from "../../common/database";
import List from "../../components/list";
import SelectionHeader from "../../components/selection-header";
import { useNavigationFocus } from "../../hooks/use-navigation-focus";
import {
  ToastManager,
  eSubscribeEvent,
  eUnSubscribeEvent
} from "../../services/event-manager";
import { NavigationProps } from "../../services/navigation";
import useNavigationStore from "../../stores/use-navigation-store";
import { eOnRefreshSearch } from "../../utils/events";
import { SearchBar } from "./search-bar";
import { FilteredSelector } from "@notesnook/core";
import { strings } from "@notesnook/intl";
export const Search = ({ route, navigation }: NavigationProps<"Search">) => {
  const [results, setResults] = useState<VirtualizedGrouping<Item>>();
  const [loading, setLoading] = useState(false);
  const [searchStatus, setSearchStatus] = useState<string>();
  const currentQuery = useRef<string>();
  const timer = useRef<NodeJS.Timeout>();
  const isFocused = useNavigationFocus(navigation, {
    onFocus: (prev) => {
      useNavigationStore.getState().setFocusedRouteId(route.name);
      return !prev?.current;
    },
    onBlur: () => false
  });

  const onSearch = React.useCallback(
    async (query?: string) => {
      currentQuery.current = query;
      if (!query) {
        setResults(undefined);
        setLoading(false);
        setSearchStatus(undefined);
        return;
      }
      try {
        setLoading(true);
        let results: VirtualizedGrouping<Item> | undefined;

        switch (route.params.type) {
          case "note":
            results = await db.lookup
              .notes(query, route.params.items as FilteredSelector<Note>)
              .sorted();
            break;
          case "notebook":
            results = await db.lookup.notebooks(query).sorted();
            break;
          case "tag":
            results = await db.lookup.tags(query).sorted();
            break;
          case "reminder":
            results = await db.lookup.reminders(query).sorted();
            break;
          case "trash":
            results = await db.lookup.trash(query).sorted();
            break;
          case "attachment":
            results = await db.lookup.attachments(query).sorted();
            break;
          default:
            results = undefined;
        }

        if (!results) {
          setSearchStatus(strings.noResultsFound(query));
          setLoading(false);
          return;
        }

        console.log(
          `Found ${results.placeholders?.length} results for ${query}`
        );
        if (currentQuery.current !== query) return;
        await results.item(0);
        setResults(results);
        if (results.placeholders?.length === 0) {
          setSearchStatus(strings.noResultsFound(query));
        } else {
          setSearchStatus(undefined);
        }
        setLoading(false);
      } catch (e) {
        ToastManager.error(e as Error);
        DatabaseLogger.error(e);
      }
    },
    [route.params?.items, route.params.type]
  );

  useEffect(() => {
    const onRefreshSearch = (type: string) => {
      if (type === undefined || type === route.params?.type) {
        onSearch(currentQuery.current);
      }
    };
    eSubscribeEvent(eOnRefreshSearch, onRefreshSearch);
    return () => {
      eUnSubscribeEvent(eOnRefreshSearch, onRefreshSearch);
    };
  }, [onSearch, route.params?.type]);

  return (
    <>
      <SelectionHeader
        id={route.name}
        items={results}
        type={route.params?.type}
        renderedInRoute={route.name}
      />
      <SearchBar
        onChangeText={(query) => {
          clearTimeout(timer.current);
          timer.current = setTimeout(() => {
            onSearch(query);
          }, 300);
        }}
        loading={loading}
      />
      <List
        data={results}
        dataType={route.params?.type}
        renderedInRoute={route.name}
        loading={loading}
        placeholder={{
          title: route.name,
          paragraph: searchStatus || strings.searchInRoute(route.params?.title),
          loading: strings.searchingFor(currentQuery.current as string)
        }}
      />
    </>
  );
};
