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

import { StateCreator } from "zustand";

type NNStoreCreator<T> = StateCreator<
  T,
  [["zustand/subscribeWithSelector", never], ["zustand/mutative", never]]
>;

export type GetState<T> = Parameters<NNStoreCreator<T>>[1];
export type SetState<T> = Parameters<NNStoreCreator<T>>[0];

export interface IStore<T extends object> {
  new (set: SetState<T>, get: GetState<T>): T;
}

export default class BaseStore<T extends object> {
  constructor(
    private readonly setState: SetState<T>,
    readonly get: GetState<T>
  ) {}

  set(
    nextStateOrUpdater: Parameters<SetState<T>>[0],
    shouldReplace?: boolean | undefined
  ) {
    this.setState(
      typeof nextStateOrUpdater === "function"
        ? (state) => {
            nextStateOrUpdater(state);
          }
        : nextStateOrUpdater,
      shouldReplace
    );
  }
}
