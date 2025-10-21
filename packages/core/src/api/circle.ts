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

import hosts from "../utils/constants.js";
import http from "../utils/http.js";
import Database from "./index.js";

export type CirclePartner = {
  id: string;
  name: string;
  url: string;
  logoBase64: string;
  shortDescription: string;
  longDescription: string;
  offerDescription: string;
  codeRedeemUrl?: string;
};
export class Circle {
  constructor(private readonly db: Database) {}

  partners(): Promise<CirclePartner[] | undefined> {
    return http.get(`${hosts.SUBSCRIPTIONS_HOST}/circle/partners`);
  }

  async redeem(partnerId: string): Promise<{ code?: string } | undefined> {
    const token = await this.db.tokenManager.getAccessToken();
    return http.get(
      `${hosts.SUBSCRIPTIONS_HOST}/circle/redeem?partnerId=${partnerId}`,
      token
    );
  }
}
