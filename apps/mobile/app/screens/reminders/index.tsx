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

import { strings } from "@notesnook/intl";
import React from "react";
import { FloatingButton } from "../../components/container/floating-button";
import DelayLayout from "../../components/delay-layout";
import { Header } from "../../components/header";
import List from "../../components/list";
import SelectionHeader from "../../components/selection-header";
import { useNavigationFocus } from "../../hooks/use-navigation-focus";
import Navigation, { NavigationProps } from "../../services/navigation";
import SettingsService from "../../services/settings";
import useNavigationStore from "../../stores/use-navigation-store";
import { useReminders } from "../../stores/use-reminder-store";
import AddReminder from "../add-reminder";
import { isFeatureAvailable } from "@notesnook/common";
import { ToastManager } from "../../services/event-manager";
import PaywallSheet from "../../components/sheets/paywall";

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
        onPressDefaultRightButton={async () => {
          const reminderFeature = await isFeatureAvailable("activeReminders");
          if (!reminderFeature.isAllowed) {
            ToastManager.show({
              type: "info",
              message: reminderFeature.error,
              actionText: strings.upgrade(),
              func: () => {
                PaywallSheet.present(reminderFeature);
              }
            });
            return;
          }
          AddReminder.present();
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
            action: async () => {
              const reminderFeature = await isFeatureAvailable(
                "activeReminders"
              );
              if (!reminderFeature.isAllowed) {
                ToastManager.show({
                  type: "info",
                  message: reminderFeature.error,
                  actionText: strings.upgrade(),
                  func: () => {
                    PaywallSheet.present(reminderFeature);
                  }
                });
                return;
              }
              AddReminder.present();
            },
            loading: strings.loadingReminders()
          }}
        />

        <FloatingButton
          onPress={async () => {
            const reminderFeature = await isFeatureAvailable("activeReminders");
            if (!reminderFeature.isAllowed) {
              ToastManager.show({
                type: "info",
                message: reminderFeature.error,
                actionText: strings.upgrade(),
                func: () => {
                  PaywallSheet.present(reminderFeature);
                }
              });
              return;
            }
            AddReminder.present();
          }}
          alwaysVisible
        />
      </DelayLayout>

      <SelectionHeader id={route.name} items={reminders} type="reminder" />
    </>
  );
};

export default Reminders;
