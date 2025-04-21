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

import { User } from "@notesnook/core";
import { SUBSCRIPTION_STATUS } from "../common/constants";
import {
  useStore as useUserStore,
  store as userstore
} from "../stores/user-store";

export function useIsUserPremium() {
  const user = useUserStore((store) => store.user);
  return isUserPremium(user);
}

export function isUserPremium(user?: User) {
  if (IS_TESTING) return !("isBasic" in window);
  if (!user) user = userstore.get().user;
  if (!user) return false;

  const subStatus = user.subscription.type;
  return (
    subStatus === SUBSCRIPTION_STATUS.BETA ||
    subStatus === SUBSCRIPTION_STATUS.PREMIUM ||
    subStatus === SUBSCRIPTION_STATUS.PREMIUM_CANCELED ||
    subStatus === SUBSCRIPTION_STATUS.TRIAL
  );
}

export function isUserSubscribed(user?: User) {
  if (!user) user = userstore.get().user;
  if (!user) return false;

  const subStatus = user.subscription?.type;
  return (
    subStatus === SUBSCRIPTION_STATUS.PREMIUM ||
    subStatus === SUBSCRIPTION_STATUS.PREMIUM_CANCELED
  );
}
