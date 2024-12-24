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
import SelectionHeader from "../../components/selection-header";
import ReminderSheet from "../../components/sheets/reminder";
import { useNavigationFocus } from "../../hooks/use-navigation-focus";
import Navigation, { NavigationProps } from "../../services/navigation";
import SettingsService from "../../services/settings";
import useNavigationStore from "../../stores/use-navigation-store";
import { useReminders } from "../../stores/use-reminder-store";
import { strings } from "@notesnook/intl";

export const Reminders = ({
  navigation,
  route
}: NavigationProps<"Reminders">) => {
  const [reminders, loading] = useReminders();
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

  return (
    <>
      <SelectionHeader id={route.name} items={reminders} type="reminder" />
      <Header
        renderedInRoute={route.name}
        title={strings.routes[route.name]()}
        canGoBack={false}
        hasSearch={true}
        onSearch={() => {
          Navigation.push("Search", {
            placeholder: strings.searchInRoute(route.name),
            type: "reminder",
            title: route.name,
            route: route.name
          });
        }}
        id={route.name}
        onPressDefaultRightButton={() => {
          ReminderSheet.present();
        }}
      />

      <DelayLayout wait={loading}>
        <List
          data={reminders}
          dataType="reminder"
          headerTitle={strings.routes[route.name]()}
          renderedInRoute="Reminders"
          loading={loading}
          placeholder={{
            title: strings.yourReminders(),
            paragraph: strings.remindersEmpty(),
            button: strings.setReminder(),
            action: () => {
              ReminderSheet.present();
            },
            loading: strings.loadingReminders()
          }}
        />

        <FloatingButton
          onPress={() => {
            ReminderSheet.present();
          }}
        />
      </DelayLayout>
    </>
  );
};

export default Reminders;
