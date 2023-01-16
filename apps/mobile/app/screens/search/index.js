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

import React, { useEffect } from "react";
import DelayLayout from "../../components/delay-layout";
import List from "../../components/list";
import { useNavigationFocus } from "../../hooks/use-navigation-focus";
import SearchService from "../../services/search";
import useNavigationStore from "../../stores/use-navigation-store";
import { useSearchStore } from "../../stores/use-search-store";
import { inputRef } from "../../utils/global-refs";
import { sleep } from "../../utils/time";
export const Search = ({ navigation, route }) => {
  const searchResults = useSearchStore((state) => state.searchResults);
  const searching = useSearchStore((state) => state.searching);
  const searchStatus = useSearchStore((state) => state.searchStatus);
  const setSearchResults = useSearchStore((state) => state.setSearchResults);
  const setSearchStatus = useSearchStore((state) => state.setSearchStatus);

  useNavigationFocus(navigation, {
    onFocus: () => {
      sleep(300).then(() => inputRef.current?.focus());
      useNavigationStore.getState().update({
        name: route.name
      });
      return false;
    },
    onBlur: () => false
  });

  useEffect(() => {
    return () => {
      setSearchResults([]);
      setSearchStatus(false, null);
    };
  }, [setSearchResults, setSearchStatus]);

  return (
    <DelayLayout wait={searching}>
      <List
        listData={searchResults}
        type="search"
        screen="Search"
        focused={() => navigation.isFocused()}
        placeholderText={"Notes you write appear here"}
        jumpToDialog={true}
        loading={searching}
        CustomHeader={true}
        placeholderData={{
          heading: "Search",
          paragraph:
            searchStatus ||
            `Type a keyword to search in ${
              SearchService.getSearchInformation().title
            }`,
          button: null,
          loading: "Searching..."
        }}
      />
    </DelayLayout>
  );
};
