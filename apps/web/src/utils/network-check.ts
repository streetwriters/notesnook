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

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import Worker from "worker-loader?filename=static/workers/network-check.worker.[contenthash].js!./network-check.worker";
import type { NetworkCheck as NetworkWorker } from "./network-check.worker";
import { wrap, Remote } from "comlink";

export class NetworkCheck {
  private worker!: globalThis.Worker;
  private network!: Remote<NetworkWorker>;

  constructor() {
    this.worker = new Worker();
    this.network = wrap<NetworkWorker>(this.worker);
  }

  waitForInternet() {
    return this.network.waitForInternet();
  }
}
