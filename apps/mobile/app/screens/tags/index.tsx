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
import useNavigationStore from "../../stores/use-navigation-store";
import { useTagStore } from "../../stores/use-tag-store";
const prepareSearch = () => {
  SearchService.update({
    placeholder: "Search in tags",
    type: "tags",
    title: "Tags",
    get: () => db.tags?.all
  });
};

export const Tags = ({ navigation, route }: NavigationProps<"Tags">) => {
  const tags = useTagStore((state) => state.tags);
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
    <DelayLayout>
      <List
        data={tags}
        dataType="tag"
        headerTitle="Tags"
        loading={!isFocused}
        renderedInRoute="Tags"
        placeholder={{
          title: "Your tags",
          paragraph: "You have not created any tags for your notes yet.",
          loading: "Loading your tags."
        }}
      />
    </DelayLayout>
  );
};

export default Tags;
