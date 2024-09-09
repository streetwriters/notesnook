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

import { SettingsGroup } from "./types";
import { SubscriptionStatus } from "./components/subscription-status";
import { showToast } from "../../utils/toast";
import { db } from "../../common/db";
import { BillingHistory } from "./components/billing-history";
import { useStore as useUserStore } from "../../stores/user-store";
import { isUserSubscribed } from "../../hooks/use-is-user-premium";
import { strings } from "@notesnook/intl";

export const SubscriptionSettings: SettingsGroup[] = [
  {
    key: "subscription",
    section: "subscription",
    header: SubscriptionStatus,
    settings: [
      {
        key: "payment-method",
        title: strings.paymentMethod(),
        description: strings.changePaymentMethodDescription(),
        isHidden: () => {
          const user = useUserStore.getState().user;
          return !isUserSubscribed(user) || user?.subscription.provider !== 3;
        },
        components: [
          {
            type: "button",
            title: strings.update(),
            action: async () => {
              try {
                window.open(await db.subscriptions.updateUrl(), "_blank");
              } catch (e) {
                if (e instanceof Error) showToast("error", e.message);
              }
            },
            variant: "secondary"
          }
        ]
      },
      {
        key: "billing-history",
        title: strings.billingHistory(),
        isHidden: () => {
          const user = useUserStore.getState().user;
          return !isUserSubscribed(user) || user?.subscription.provider !== 3;
        },
        components: [{ type: "custom", component: BillingHistory }]
      }
    ]
  }
];
