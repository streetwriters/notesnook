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

import { create } from "zustand";

export type DatabaseStatus = "pending" | "ready" | "error";

type BootStore = {
  status: DatabaseStatus;
  message?: string;
  version?: string;
  online?: boolean;
  user?: { email: string };
};

export const useBootStore = create<BootStore>(() => ({ status: "pending" }));

let resolveReady: () => void = () => undefined;
const ready = new Promise<void>((resolve) => {
  resolveReady = resolve;
});

export function setDatabaseReady(
  state: Pick<BootStore, "version" | "online" | "user">
) {
  useBootStore.setState({ status: "ready", ...state });
  resolveReady();
}

export function setDatabaseFailed(message: string) {
  useBootStore.setState({ status: "error", message });
}

export function isDatabaseReady() {
  return useBootStore.getState().status === "ready";
}

export function useDatabaseReady() {
  return useBootStore((state) => state.status === "ready");
}

export function whenDatabaseReady() {
  return ready;
}
