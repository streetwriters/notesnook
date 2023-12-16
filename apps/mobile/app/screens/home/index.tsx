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
import { FloatingButton } from "../../components/container/floating-button";
import DelayLayout from "../../components/delay-layout";
import { Header } from "../../components/header";
import List from "../../components/list";
import { useNavigationFocus } from "../../hooks/use-navigation-focus";
import Navigation, { NavigationProps } from "../../services/navigation";
import SettingsService from "../../services/settings";
import { useNoteStore } from "../../stores/use-notes-store";
import { openEditor } from "../notes/common";
import useNavigationStore from "../../stores/use-navigation-store";
import SelectionHeader from "../../components/selection-header";

export const Home = ({ navigation, route }: NavigationProps<"Notes">) => {
  const notes = useNoteStore((state) => state.notes);
  const loading = useNoteStore((state) => state.loading);
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
      <SelectionHeader id={route.name} items={notes} type="note" />
      <Header
        renderedInRoute={route.name}
        title={route.name}
        canGoBack={false}
        hasSearch={true}
        onSearch={() => {
          Navigation.push("Search", {
            placeholder: `Type a keyword to search in ${route.name?.toLowerCase()}`,
            type: "note",
            title: route.name,
            route: route.name
          });
        }}
        id={route.name}
        onPressDefaultRightButton={openEditor}
      />
      <DelayLayout wait={loading}>
        <List
          data={notes}
          dataType="note"
          renderedInRoute={route.name}
          loading={loading || !isFocused}
          headerTitle={route.name}
          placeholder={{
            title: route.name?.toLowerCase(),
            paragraph: `You have not added any ${route.name.toLowerCase()} yet.`,
            button: "Add your first note",
            action: openEditor,
            loading: "Loading your notes"
          }}
        />
        <FloatingButton title="Create a new note" onPress={openEditor} />
      </DelayLayout>
    </>
  );
};

export default Home;
