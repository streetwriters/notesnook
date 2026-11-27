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

// The Paddle.js checkout event types buy-dialog/types.ts names. Web imports
// them from @paddle/paddle-js; desktop has no Paddle.js (checkout opens in the
// browser), so these are the shapes the types file needs.

export type CheckoutEventNames = string;
export type CheckoutEventsCustomer = Record<string, unknown>;
export type CheckoutEventsDiscount = Record<string, unknown>;
export type CheckoutEventsItem = Record<string, unknown>;
export type PaddleEventData = Record<string, unknown>;
