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
import { FloatingButton } from "../../components/container/floating-button";
import DelayLayout from "../../components/delay-layout";
import { AddNotebookEvent } from "../../components/dialog-provider/recievers";
import List from "../../components/list";
import { Walkthrough } from "../../components/walkthroughs";
import { useNavigationFocus } from "../../hooks/use-navigation-focus";
import Navigation, { NavigationProps } from "../../services/navigation";
import SearchService from "../../services/search";
import SettingsService from "../../services/settings";
import useNavigationStore from "../../stores/use-navigation-store";
import { useNotebookStore } from "../../stores/use-notebook-store";
import { Config } from "react-native-config";

const onPressFloatingButton = () => {
  AddNotebookEvent();
};

const prepareSearch = () => {
  SearchService.update({
    placeholder: "Type a keyword to search in notebooks",
    type: "notebooks",
    title: "Notebooks",
    get: () => db.notebooks?.all
  });
};

const PLACEHOLDER_DATA = {
  heading: "Your notebooks",
  paragraph: "You have not added any notebooks yet.",
  button: "Add your first notebook",
  action: onPressFloatingButton,
  loading: "Loading your notebooks"
};

export const Notebooks = ({
  navigation,
  route
}: NavigationProps<"Notebooks">) => {
  const notebooks = useNotebookStore((state) => state.notebooks);
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
      useNavigationStore.getState().setButtonAction(onPressFloatingButton);
      //@ts-ignore need to update typings in core to fix this
      if (db.notebooks.all.length === 0 && !Config.isTesting) {
        Walkthrough.present("notebooks");
      } else {
        Walkthrough.update("notebooks");
      }

      return !prev?.current;
    },
    onBlur: () => false,
    delay: SettingsService.get().homepage === route.name ? 1 : -1
  });

  return (
    <DelayLayout>
      <List
        listData={notebooks}
        type="notebooks"
        screen="Notebooks"
        loading={!isFocused}
        placeholderData={PLACEHOLDER_DATA}
        headerProps={{
          heading: "Notebooks"
        }}
      />

      {!notebooks || notebooks.length === 0 || !isFocused ? null : (
        <FloatingButton
          title="Create a new notebook"
          onPress={onPressFloatingButton}
        />
      )}
    </DelayLayout>
  );
};

export default Notebooks;
