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

const _ignore = "";

/**
 * @typedef {{
 *  groupBy: "abc" | "year" | "month" | "week" | "none" | undefined,
 *  sortBy: "dateCreated" | "dateDeleted" | "dateEdited" | "dateModified" | "title" | "dueDate",
 *  sortDirection: "desc" | "asc"
 * }} GroupOptions
 */

/**
 * @typedef {"home" | "notes" | "notebooks" | "tags" | "topics" | "trash" | "favorites" | "reminders"} GroupingKey
 */

/**
 * @typedef {{
 *  id: string,
 *  email: string,
 *  isEmailConfirmed: boolean,
 *  marketingConsent: boolean,
 *  mfa: {
 *      isEnabled: boolean,
 *      primaryMethod: "app" | "sms" | "email",
 *      secondaryMethod: "app" | "sms" | "email",
 *      remainingValidCodes: number
 *  },
 *  subscription: {
 *      appId: 0,
 *      cancelURL: string | null,
 *      expiry: number,
 *      productId: string,
 *      provider: 0 | 1 | 2 | 3,
 *      start: number,
 *      type: 0 | 1 | 2 | 5 | 6 | 7,
 *      updateURL: string | null,
 *  }
 * }} User
 */
