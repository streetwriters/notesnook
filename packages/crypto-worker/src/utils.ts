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

type Message<T> = {
  type: string;
  data?: T;
};

export function sendEventWithResult<T>(type: string): Promise<T> {
  return new Promise<T>((resolve) => {
    // eslint-disable-next-line no-restricted-globals
    addEventListener(
      "message",
      (ev: MessageEvent<Message<T>>) => {
        const { type: messageType, data } = ev.data;
        if (messageType === type && data) {
          resolve(data);
        }
      },
      { once: true }
    );
    postMessage({ type });
  });
}
