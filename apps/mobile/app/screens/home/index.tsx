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
import List from "../../components/list";
import { useNavigationFocus } from "../../hooks/use-navigation-focus";
import Navigation, { NavigationProps } from "../../services/navigation";
import SearchService from "../../services/search";
import SettingsService from "../../services/settings";
import useNavigationStore from "../../stores/use-navigation-store";
import { useNoteStore } from "../../stores/use-notes-store";
import { openEditor } from "../notes/common";

const prepareSearch = () => {
  SearchService.update({
    placeholder: "Type a keyword to search in notes",
    type: "notes",
    title: "Notes",
    get: () => db.notes?.all
  });
};

const PLACEHOLDER_DATA = {
  heading: "Notes",
  paragraph: "You have not added any notes yet.",
  button: "Add your first note",
  action: openEditor,
  loading: "Loading your notes"
};

export const Home = ({ navigation, route }: NavigationProps<"Notes">) => {
  const notes = useNoteStore((state) => state.notes);
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
      useNavigationStore.getState().setButtonAction(openEditor);
      return !prev?.current;
    },
    onBlur: () => false,
    delay: SettingsService.get().homepage === route.name ? 1 : -1
  });
  return (
    <DelayLayout wait={loading} delay={500}>
      <List
        listData={notes}
        type="notes"
        screen="Home"
        loading={loading || !isFocused}
        headerProps={{
          heading: "Notes"
        }}
        placeholderData={PLACEHOLDER_DATA}
      />

      <FloatingButton title="Create a new note" onPress={openEditor} />
    </DelayLayout>
  );
};

export default Home;
