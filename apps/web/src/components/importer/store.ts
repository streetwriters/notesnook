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

import {
  IProvider,
  ProviderFactory,
  Providers
} from "@notesnook-importer/core";
import { useSyncExternalStore } from "react";
import { TransformResult } from "./types";

export type ImporterState = {
  providerId?: Providers;
  provider?: IProvider;
  instanceKey: string;
  transformResult?: TransformResult;
};

const newKey = () => `${Math.random()}`;
let state: ImporterState = { instanceKey: newKey() };
const listeners = new Set<() => void>();

function setState(next: ImporterState) {
  state = next;
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export const importerStore = {
  getState: () => state,
  subscribe,
  selectProvider(providerId: Providers) {
    setState({
      providerId,
      provider: ProviderFactory.getProvider(providerId),
      instanceKey: newKey(),
      transformResult: undefined
    });
  },
  setResult(transformResult?: TransformResult) {
    setState({ ...state, transformResult });
  },
  startOver() {
    setState({ ...state, transformResult: undefined, instanceKey: newKey() });
  },
  reset() {
    setState({ instanceKey: newKey() });
  }
};

export function useImporterState() {
  return useSyncExternalStore(subscribe, () => state);
}
