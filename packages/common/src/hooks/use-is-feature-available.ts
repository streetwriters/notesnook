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

import { useEffect, useState } from "react";
import {
  areFeaturesAvailable,
  FeatureId,
  FeatureResult,
  isFeatureAvailable
} from "../utils/index.js";
import { EV, EVENTS } from "@notesnook/core";

export function useIsFeatureAvailable<TId extends FeatureId>(
  id: TId | undefined,
  value?: number
) {
  const [result, setResult] = useState<FeatureResult<TId>>();

  useEffect(() => {
    if (!id) return;

    isFeatureAvailable(id, value).then((result) => setResult(result));
    const userSubscriptionUpdated = EV.subscribe(
      EVENTS.userSubscriptionUpdated,
      () => {
        isFeatureAvailable(id, value).then((result) => setResult(result));
      }
    );
    return () => {
      userSubscriptionUpdated.unsubscribe();
    };
  }, []);

  return result;
}

export function useAreFeaturesAvailable<TIds extends FeatureId[]>(
  ids: TIds,
  values: number[] = []
) {
  const [result, setResult] =
    useState<{ [K in TIds[number]]: FeatureResult<K> }>();

  useEffect(() => {
    areFeaturesAvailable(ids, values).then((result) => setResult(result));
    const userSubscriptionUpdated = EV.subscribe(
      EVENTS.userSubscriptionUpdated,
      () => {
        areFeaturesAvailable(ids, values).then((result) => setResult(result));
      }
    );
    return () => {
      userSubscriptionUpdated.unsubscribe();
    };
  }, []);

  return result;
}
