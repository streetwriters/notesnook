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
} from "../utils";
import { usePromise } from "./use-promise";

export function useIsFeatureAvailable<TId extends FeatureId>(
  id: TId,
  value?: number
) {
  const result = usePromise(() => isFeatureAvailable(id, value), [id, value]);
  return result.status === "fulfilled" ? result.value : undefined;
}

export function useAreFeaturesAvailable<TIds extends FeatureId[]>(
  ids: TIds,
  values: number[] = []
) {
  const [result, setResult] =
    useState<Record<TIds[number], FeatureResult<TIds[number]>>>();

  useEffect(() => {
    areFeaturesAvailable(ids, values).then((result) => setResult(result));
  }, []);

  return result;
}
