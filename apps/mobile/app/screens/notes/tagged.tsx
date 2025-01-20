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

import { Tag } from "@notesnook/core";
import React from "react";
import NotesPage from ".";
import { db } from "../../common/database";
import Navigation, { NavigationProps } from "../../services/navigation";
import useNavigationStore, {
  NotesScreenParams
} from "../../stores/use-navigation-store";
import { PLACEHOLDER_DATA, openEditor } from "./common";

export const TaggedNotes = ({
  navigation,
  route
}: NavigationProps<"TaggedNotes">) => {
  return (
    <NotesPage
      navigation={navigation}
      route={route}
      get={TaggedNotes.get}
      placeholder={PLACEHOLDER_DATA}
      onPressFloatingButton={openEditor}
      canGoBack={route.params?.canGoBack}
      focusControl={true}
    />
  );
};

TaggedNotes.get = async (params: NotesScreenParams, grouped = true) => {
  if (!grouped) {
    return await db.relations.from(params.item, "note").resolve();
  }

  return await db.relations
    .from(params.item, "note")
    .selector.grouped(db.settings.getGroupOptions("notes"));
};

TaggedNotes.navigate = (item: Tag, canGoBack?: boolean) => {
  if (!item) return;

  const { focusedRouteId } = useNavigationStore.getState();

  if (focusedRouteId === item.id) {
    return;
  }

  Navigation.push<"TaggedNotes">("TaggedNotes", {
    item: item,
    canGoBack,
    title: item.title
  });
};
