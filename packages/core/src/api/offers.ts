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

import { CLIENT_ID } from "../common.js";
import hosts from "../utils/constants.js";
import http from "../utils/http.js";

export class Offers {
  static async getCode(promo: string, platform: "ios" | "android" | "web") {
    const result = await http.get(
      `${hosts.SUBSCRIPTIONS_HOST}/offers?promoCode=${promo}&clientId=${CLIENT_ID}&platformId=${platform}`
    );
    return result.code;
  }
}
