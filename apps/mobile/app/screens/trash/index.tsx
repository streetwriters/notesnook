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
import { presentDialog } from "../../components/dialog/functions";
import { Header } from "../../components/header";
import List from "../../components/list";
import { useNavigationFocus } from "../../hooks/use-navigation-focus";
import { ToastManager } from "../../services/event-manager";
import Navigation, { NavigationProps } from "../../services/navigation";
import useNavigationStore from "../../stores/use-navigation-store";
import { useSelectionStore } from "../../stores/use-selection-store";
import { useTrashStore } from "../../stores/use-trash-store";
import SelectionHeader from "../../components/selection-header";

const onPressFloatingButton = () => {
  presentDialog({
    title: "Clear trash",
    paragraph: "Are you sure you want to clear the trash?",
    positiveText: "Clear",
    negativeText: "Cancel",
    positivePress: async () => {
      await db.trash?.clear();
      useTrashStore.getState().setTrash();
      useSelectionStore.getState().clearSelection();
      ToastManager.show({
        heading: "Trash cleared",
        message:
          "All notes and notebooks in the trash have been removed permanently.",
        type: "success",
        context: "local"
      });
    },
    positiveType: "errorShade"
  });
};
const PLACEHOLDER_DATA = (trashCleanupInterval = 7) => ({
  title: "Trash",
  paragraph:
    trashCleanupInterval === -1
      ? "Set automatic trash cleanup interval from Settings > Behaviour > Clean trash interval."
      : `Items in the trash will be permanently deleted after after ${trashCleanupInterval} days.`,
  loading: "Loading trash items"
});

export const Trash = ({ navigation, route }: NavigationProps<"Trash">) => {
  const trash = useTrashStore((state) => state.trash);
  const isFocused = useNavigationFocus(navigation, {
    onFocus: () => {
      Navigation.routeNeedsUpdate(
        route.name,
        Navigation.routeUpdateFunctions[route.name]
      );
      useNavigationStore.getState().setFocusedRouteId(route.name);
      if (
        !useTrashStore.getState().trash ||
        useTrashStore.getState().trash?.ids?.length === 0
      ) {
        useTrashStore.getState().setTrash();
      }
      return false;
    },
    onBlur: () => false
  });

  return (
    <>
      <SelectionHeader id={route.name} items={trash} type="trash" />
      <Header
        renderedInRoute={route.name}
        title={route.name}
        canGoBack={false}
        hasSearch={true}
        onSearch={() => {
          Navigation.push("Search", {
            placeholder: `Type a keyword to search in ${route.name}`,
            type: "trash",
            title: route.name,
            route: route.name
          });
        }}
      />
      <DelayLayout>
        <List
          data={trash}
          dataType="trash"
          renderedInRoute="Trash"
          loading={!isFocused}
          placeholder={PLACEHOLDER_DATA(db.settings.getTrashCleanupInterval())}
          headerTitle="Trash"
        />

        {trash && trash?.ids?.length !== 0 ? (
          <FloatingButton
            title="Clear all trash"
            onPress={onPressFloatingButton}
            alwaysVisible={true}
          />
        ) : null}
      </DelayLayout>
    </>
  );
};

export default Trash;
