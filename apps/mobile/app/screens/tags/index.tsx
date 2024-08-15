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
import useNavigationStore from "../../stores/use-navigation-store";
import { useTags } from "../../stores/use-tag-store";
import { strings } from "@notesnook/intl";

export const Tags = ({ navigation, route }: NavigationProps<"Tags">) => {
  const [tags, loading] = useTags();
  const isFocused = useNavigationFocus(navigation, {
    onFocus: (prev) => {
      Navigation.routeNeedsUpdate(
        route.name,
        Navigation.routeUpdateFunctions[route.name]
      );
      useNavigationStore.getState().setFocusedRouteId(route.name);
      return !prev?.current;
    },
    onBlur: () => false,
    delay: SettingsService.get().homepage === route.name ? 1 : -1
  });

  return (
    <>
      <SelectionHeader
        id={route.name}
        items={tags}
        type="tag"
        renderedInRoute={route.name}
      />
      <Header
        renderedInRoute={route.name}
        id={route.name}
        title={route.name}
        canGoBack={false}
        hasSearch={true}
        onSearch={() => {
          Navigation.push("Search", {
            placeholder: strings.searchInRoute(route.name),
            type: "tag",
            title: route.name,
            route: route.name
          });
        }}
      />
      <DelayLayout wait={loading}>
        <List
          data={tags}
          dataType="tag"
          headerTitle="Tags"
          loading={!isFocused}
          renderedInRoute="Tags"
          placeholder={{
            title: strings.yourTags(),
            paragraph: strings.tagsEmpty(),
            loading: strings.loadingTags()
          }}
        />
      </DelayLayout>
    </>
  );
};

export default Tags;
