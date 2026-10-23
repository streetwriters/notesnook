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

export class LazyPromise<T> {
  private _promise!: Promise<T>;
  private _resolve?: (result: T) => void;
  private _reject?: (reason?: unknown) => void;
  private rejected = false;
  constructor() {
    this.create();
  }

  /**
   * Replaces a rejected promise with a new pending one so callers can wait
   * for a retry.
   */
  reset() {
    if (this.rejected) this.create();
  }

  resolve(result: T) {
    this._resolve?.(result);
  }

  reject(reason?: unknown) {
    this.rejected = true;
    this._reject?.(reason);
  }

  get promise() {
    return this._promise;
  }

  private create() {
    this.rejected = false;
    this._promise = new Promise((resolve, reject) => {
      this._resolve = resolve;
      this._reject = reject;
    });
    // avoid unhandled rejections when nobody is waiting
    this._promise.catch(() => {});
  }
}
