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
import { Config } from "react-native-config";
import { FloatingButton } from "../../components/container/floating-button";
import DelayLayout from "../../components/delay-layout";
import { Header } from "../../components/header";
import List from "../../components/list";
import SelectionHeader from "../../components/selection-header";
import { AddNotebookSheet } from "../../components/sheets/add-notebook";
import { Walkthrough } from "../../components/walkthroughs";
import { useNavigationFocus } from "../../hooks/use-navigation-focus";
import Navigation, { NavigationProps } from "../../services/navigation";
import SettingsService from "../../services/settings";
import useNavigationStore from "../../stores/use-navigation-store";
import { useNotebooks } from "../../stores/use-notebook-store";
import { strings } from "@notesnook/intl";

const onButtonPress = () => {
  AddNotebookSheet.present();
};

export const Notebooks = ({
  navigation,
  route
}: NavigationProps<"Notebooks">) => {
  const [notebooks, loading] = useNotebooks();

  const isFocused = useNavigationFocus(navigation, {
    onFocus: (prev) => {
      Navigation.routeNeedsUpdate(
        route.name,
        Navigation.routeUpdateFunctions[route.name]
      );
      useNavigationStore.getState().setFocusedRouteId(route.name);
      return false;
    },
    onBlur: () => false,
    delay: SettingsService.get().homepage === route.name ? 1 : -1
  });

  useEffect(() => {
    if (notebooks?.placeholders) {
      if (notebooks?.placeholders?.length === 0 && !Config.isTesting) {
        Walkthrough.present("notebooks");
      } else {
        Walkthrough.update("notebooks");
      }
    }
  }, [notebooks]);

  return (
    <>
      <SelectionHeader
        id={route.name}
        items={notebooks}
        renderedInRoute={route.name}
        type="notebook"
      />
      <Header
        renderedInRoute={route.name}
        title={strings.routes[route.name]()}
        canGoBack={route.params?.canGoBack}
        hasSearch={true}
        id={route.name}
        onSearch={() => {
          Navigation.push("Search", {
            placeholder: strings.searchInRoute(route.name),
            type: "notebook",
            title: route.name,
            route: route.name
          });
        }}
        onPressDefaultRightButton={onButtonPress}
      />
      <DelayLayout wait={loading}>
        <List
          data={notebooks}
          dataType="notebook"
          renderedInRoute="Notebooks"
          loading={loading}
          placeholder={{
            title: strings.yourNotebooks(),
            paragraph: strings.notebooksEmpty(),
            button: strings.addFirstNotebook(),
            action: onButtonPress,
            loading: strings.loadingNotebooks()
          }}
          headerTitle={strings.routes[route.name]()}
        />

        {!notebooks ||
        notebooks.placeholders.length === 0 ||
        !isFocused ? null : (
          <FloatingButton onPress={onButtonPress} />
        )}
      </DelayLayout>
    </>
  );
};

export default Notebooks;
