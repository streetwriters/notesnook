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

interface NotImplementedOptions {
  validate?: (values: any) => any;
  onClose?: (...args: any[]) => any;
  [key: string]: any;
}

export interface NotImplemented {
  (options?: NotImplementedOptions, ...rest: any[]): any;
  (value: number | string | boolean, ...rest: any[]): any;
  [key: string]: NotImplemented;
}

export function notImplemented(name: string): NotImplemented {
  const fail = () => {
    throw new Error(`${name} is not implemented on desktop yet`);
  };
  return new Proxy(fail, {
    get(_target, property) {
      if (property === "then" || typeof property === "symbol") return undefined;
      return fail();
    },
    apply: fail,
    construct: fail
  }) as unknown as NotImplemented;
}
