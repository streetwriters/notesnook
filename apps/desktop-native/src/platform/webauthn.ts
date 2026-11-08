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

import type { Unsubscribe } from "./lifecycle";

export type WebauthnStatus = "touch" | "processing";

export interface WebauthnRegistration {
  credentialId: Uint8Array;
  transports: string[];
  prfEnabled: boolean;
}

export interface Webauthn {
  isAvailable(): Promise<boolean>;
  register(options: {
    userId: Uint8Array;
    userName: string;
    displayName?: string;
    pin: string;
  }): Promise<WebauthnRegistration>;
  getPrf(options: {
    credentialId: Uint8Array;
    salt: Uint8Array;
    pin: string;
  }): Promise<Uint8Array>;
  onStatus(handler: (status: WebauthnStatus) => void): Unsubscribe;
}
