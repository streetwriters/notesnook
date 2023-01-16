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
import ReminderSheet from "../../components/sheets/reminder";
import { useNavigationFocus } from "../../hooks/use-navigation-focus";
import Navigation, { NavigationProps } from "../../services/navigation";
import SearchService from "../../services/search";
import SettingsService from "../../services/settings";
import useNavigationStore from "../../stores/use-navigation-store";
import { useReminderStore } from "../../stores/use-reminder-store";

const prepareSearch = () => {
  SearchService.update({
    placeholder: "Search in reminders",
    type: "reminders",
    title: "Reminders",
    get: () => db.reminders?.all
  });
};

const PLACEHOLDER_DATA = {
  heading: "Your reminders",
  paragraph: "You have not set any reminders yet.",
  button: "Set a new reminder",
  action: () => {
    ReminderSheet.present();
  },
  loading: "Loading reminders"
};

export const Reminders = ({
  navigation,
  route
}: NavigationProps<"Reminders">) => {
  const reminders = useReminderStore((state) => state.reminders);
  const isFocused = useNavigationFocus(navigation, {
    onFocus: (prev) => {
      Navigation.routeNeedsUpdate(
        route.name,
        Navigation.routeUpdateFunctions[route.name]
      );
      useNavigationStore.getState().update({
        name: route.name,
        beta: true
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
        listData={reminders}
        type="reminders"
        headerProps={{
          heading: "Reminders"
        }}
        loading={!isFocused}
        screen="Reminders"
        placeholderData={PLACEHOLDER_DATA}
      />

      <FloatingButton
        title="Set a new reminder"
        onPress={() => {
          ReminderSheet.present();
        }}
      />
    </DelayLayout>
  );
};

export default Reminders;
