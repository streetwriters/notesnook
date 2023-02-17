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

import create from "zustand";
import produce from "immer";
import { IconNames } from "../components/icons/resolver";

type Status = {
  key: string;
  status: string;
  progress?: number;
  icon?: IconNames;
};
interface IStatusStore {
  statuses: Record<string, Status>;
  getStatus: (key: string) => Status;
  updateStatus: (status: Status) => void;
  removeStatus: (key: string) => void;
}
const useStatusStore = create<IStatusStore>((set, get) => ({
  statuses: {},
  getStatus: (key: string) => get().statuses[key],
  updateStatus: ({ key, status, progress, icon }: Status) =>
    set(
      produce((state) => {
        if (!key) return;
        const { statuses } = state;
        const statusText = status || statuses[key]?.status;
        statuses[key] = { key, status: statusText, progress, icon };
      })
    ),
  removeStatus: (key) =>
    set(
      produce((state) => {
        const { statuses } = state;
        if (!key || !statuses[key]) return;
        delete statuses[key];
      })
    )
}));

export default function useStatus() {
  const statuses = useStatusStore((store) => store.statuses);
  return Object.values(statuses);
}

export const updateStatus = useStatusStore.getState().updateStatus;
export const removeStatus = useStatusStore.getState().removeStatus;
export const getStatus = useStatusStore.getState().getStatus;
