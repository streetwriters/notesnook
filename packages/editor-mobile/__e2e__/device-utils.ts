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

import { AndroidDevice } from "@playwright/test";
export type DeviceSize = {
  width: number;
  height: number;
  /**
   * Convert device independent height to device specific height
   */
  h: (percentage: number) => number;
  /**
   * Convert device independent width to device specific width
   */
  w: (percentage: number) => number;
};
export async function getDeviceSize(
  device: AndroidDevice
): Promise<DeviceSize> {
  const output = (await device.shell(`wm size`)).toString("utf-8");
  const parsed = /(\d+)x(\d+)/g.exec(output);
  if (!parsed) throw new Error("Failed to find device size.");

  const width = parseInt(parsed[1]);
  const height = parseInt(parsed[2]);
  return {
    height,
    width,
    h: (p) => p * height,
    w: (p) => p * width
  };
}
