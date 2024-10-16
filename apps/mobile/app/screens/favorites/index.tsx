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
import DelayLayout from "../../components/delay-layout";
import { Header } from "../../components/header";
import List from "../../components/list";
import SelectionHeader from "../../components/selection-header";
import { useNavigationFocus } from "../../hooks/use-navigation-focus";
import Navigation, { NavigationProps } from "../../services/navigation";
import SettingsService from "../../services/settings";
import { useFavorites } from "../../stores/use-favorite-store";
import useNavigationStore from "../../stores/use-navigation-store";
import { db } from "../../common/database";
import { strings } from "@notesnook/intl";

export const Favorites = ({
  navigation,
  route
}: NavigationProps<"Favorites">) => {
  const [favorites, loading, refresh] = useFavorites();
  const isFocused = useNavigationFocus(navigation, {
    onFocus: (prev) => {
      Navigation.routeNeedsUpdate(
        route.name,
        Navigation.routeUpdateFunctions[route.name]
      );
      useNavigationStore.getState().setFocusedRouteId(route?.name);
      return false;
    },
    onBlur: () => false,
    delay: SettingsService.get().homepage === route.name ? 1 : -1
  });

  return (
    <>
      <SelectionHeader id={route.name} items={favorites} type="note" />
      <Header
        renderedInRoute={route.name}
        title={strings.routes[route.name]()}
        canGoBack={false}
        hasSearch={true}
        id={route.name}
        onSearch={() => {
          Navigation.push("Search", {
            placeholder: strings.searchInRoute(route.name),
            type: "note",
            title: route.name,
            route: route.name,
            items: db.notes.favorites
          });
        }}
      />
      <DelayLayout wait={loading}>
        <List
          data={favorites}
          dataType="note"
          onRefresh={() => {
            refresh();
          }}
          renderedInRoute="Favorites"
          loading={loading}
          placeholder={{
            title: strings.yourFavorites(),
            paragraph: strings.favoritesEmpty(),
            loading: strings.loadingFavorites()
          }}
          headerTitle={strings.routes.Favorites()}
        />
      </DelayLayout>
    </>
  );
};

export default Favorites;
