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

import React from "react";
import { db } from "../../common/database";
import DelayLayout from "../../components/delay-layout";
import List from "../../components/list";
import { useNavigationFocus } from "../../hooks/use-navigation-focus";
import Navigation, { NavigationProps } from "../../services/navigation";
import SearchService from "../../services/search";
import SettingsService from "../../services/settings";
import { useFavoriteStore } from "../../stores/use-favorite-store";
import useNavigationStore from "../../stores/use-navigation-store";
import { useNoteStore } from "../../stores/use-notes-store";
const prepareSearch = () => {
  SearchService.update({
    placeholder: "Search in favorites",
    type: "notes",
    title: "Favorites",
    get: () => db.notes?.favorites
  });
};

const PLACEHOLDER_DATA = {
  heading: "Your favorites",
  paragraph: "You have not added any notes to favorites yet.",
  button: null,
  loading: "Loading your favorites"
};

export const Favorites = ({
  navigation,
  route
}: NavigationProps<"Favorites">) => {
  const favorites = useFavoriteStore((state) => state.favorites);
  const setFavorites = useFavoriteStore((state) => state.setFavorites);
  const loading = useNoteStore((state) => state.loading);
  const isFocused = useNavigationFocus(navigation, {
    onFocus: (prev) => {
      Navigation.routeNeedsUpdate(
        route.name,
        Navigation.routeUpdateFunctions[route.name]
      );
      useNavigationStore.getState().update({
        name: route.name
      });
      SearchService.prepareSearch = prepareSearch;
      return !prev?.current;
    },
    onBlur: () => false,
    delay: SettingsService.get().homepage === route.name ? 1 : -1
  });

  return (
    <DelayLayout wait={loading}>
      <List
        listData={favorites}
        type="notes"
        refreshCallback={() => {
          setFavorites();
        }}
        screen="Favorites"
        loading={loading || !isFocused}
        placeholderData={PLACEHOLDER_DATA}
        headerProps={{
          heading: "Favorites"
        }}
      />
    </DelayLayout>
  );
};

export default Favorites;
