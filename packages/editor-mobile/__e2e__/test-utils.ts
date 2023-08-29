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
  AndroidDevice,
  BrowserContext,
  TestInfo,
  _android as android,
  test
} from "@playwright/test";
import { Keyboard, SUPPORTED_KEYBOARDS, getKeyboards } from "./keyboard-utils";
import * as ip from "ip";
import { DeviceSize, getDeviceSize } from "./device-utils";

type AndroidTestArgs = {
  chrome: BrowserContext;
  device: AndroidDevice;
  baseURL: string;
  keyboards: Keyboard[];
  size: DeviceSize;
};

const SERVER_ADDRESS = `http://${ip.address("Wi-Fi", "ipv4")}:3000`;

export function androidTest(
  title: string,
  testFunction: (
    args: AndroidTestArgs,
    testInfo: TestInfo
  ) => Promise<void> | void
) {
  test(title, async ({ channel: _ }, testInfo) => {
    const [device] = await android.devices();
    if (!device) {
      console.error("Please connect an Android device or emulator.");
      return;
    }

    const keyboards = await getKeyboards(device);
    if (!keyboards.length) {
      console.error(
        "No supported keyboard found. Please install one of",
        SUPPORTED_KEYBOARDS
      );
      return;
    }

    const deviceSize = await getDeviceSize(device);

    await device.shell("am force-stop com.android.chrome");
    const chrome = await device.launchBrowser({});

    await testFunction(
      {
        chrome: chrome,
        device,
        keyboards,
        baseURL: SERVER_ADDRESS,
        size: deviceSize
      },
      testInfo
    );

    await device.shell("am force-stop com.android.chrome");
    await device.close();
  });
}
