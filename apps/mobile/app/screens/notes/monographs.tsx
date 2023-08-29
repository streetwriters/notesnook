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

import { groupArray } from "@notesnook/core/dist/utils/grouping";
import React from "react";
import NotesPage, { PLACEHOLDER_DATA } from ".";
import { db } from "../../common/database";
import Navigation, { NavigationProps } from "../../services/navigation";
import { NotesScreenParams } from "../../stores/use-navigation-store";
import { MonographType } from "../../utils/types";
import { openMonographsWebpage } from "./common";
export const Monographs = ({
  navigation,
  route
}: NavigationProps<"Monographs">) => {
  return (
    <NotesPage
      navigation={navigation}
      route={route}
      get={Monographs.get}
      placeholderData={PLACEHOLDER_DATA}
      onPressFloatingButton={openMonographsWebpage}
      canGoBack={route.params?.canGoBack}
      focusControl={true}
    />
  );
};

Monographs.get = (params?: NotesScreenParams, grouped = true) => {
  const notes = db.monographs?.all || [];
  return grouped
    ? groupArray(notes, db.settings.getGroupOptions("notes"))
    : notes;
};

Monographs.navigate = (item?: MonographType, canGoBack?: boolean) => {
  Navigation.navigate<"Monographs">(
    {
      name: "Monographs",
      type: "monograph"
    },
    {
      item: { type: "monograph" } as any,
      canGoBack: canGoBack as boolean,
      title: "Monographs"
    }
  );
};
