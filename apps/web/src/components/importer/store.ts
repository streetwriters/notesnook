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
import createStore from "../../common/store";
import BaseStore from "../../stores";
import { TransformResult } from "./types";

const newKey = () => `${Math.random()}`;

class ImporterStore extends BaseStore<ImporterStore> {
  providerId?: Providers;
  provider?: IProvider;
  instanceKey = newKey();
  transformResult?: TransformResult;

  selectProvider = (providerId: Providers) => {
    this.set({
      providerId,
      provider: ProviderFactory.getProvider(providerId),
      instanceKey: newKey(),
      transformResult: undefined
    });
  };

  setResult = (transformResult?: TransformResult) => {
    this.set({ transformResult });
  };

  startOver = () => {
    this.set({ transformResult: undefined, instanceKey: newKey() });
  };

  reset = () => {
    this.set({
      providerId: undefined,
      provider: undefined,
      transformResult: undefined,
      instanceKey: newKey()
    });
  };
}

const [useStore, store] = createStore<ImporterStore>(
  (set, get) => new ImporterStore(set, get)
);
export { useStore as useImporterStore, store as importerStore };
