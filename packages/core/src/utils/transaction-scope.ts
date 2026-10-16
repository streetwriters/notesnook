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

/**
 * Tests (Node only) register an AsyncLocalStorage-backed scope so that using
 * the root database inside a `db.transaction` callback fails loudly instead
 * of deadlocking. Production builds never register one.
 */
export type TransactionScope = {
  run<T>(fn: () => T): T;
  isActive(): boolean;
};

let scope: TransactionScope | undefined;

export function setTransactionScope(value: TransactionScope | undefined) {
  scope = value;
}

export function runInTransactionScope<T>(fn: () => T): T {
  return scope ? scope.run(fn) : fn();
}

export function assertOutsideTransaction() {
  if (scope?.isActive())
    throw new Error(
      "The root database was used inside db.transaction. Use the `tx` passed to the callback instead."
    );
}
