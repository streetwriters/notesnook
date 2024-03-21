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

import { DependencyList, useEffect, useState } from "react";

export type PromiseResult<T> =
  | PromisePendingResult<T>
  | (PromiseSettledResult<T> & { refresh: () => void });

export interface PromisePendingResult<T> {
  status: "pending";
  value?: T;
}

/**
 * Function that creates a promise, takes a signal to abort fetch requests.
 */
export type PromiseFactoryFn<T> = (signal: AbortSignal) => T | Promise<T>;

/**
 * Takes a function that creates a Promise and returns its pending, fulfilled, or rejected result.
 *
 * ```ts
 * const result = usePromise(() => fetch('/api/products'))
 * ```
 *
 * Also takes a list of dependencies, when the dependencies change the promise is recreated.
 *
 * ```ts
 * const result = usePromise(() => fetch(`/api/products/${id}`), [id])
 * ```
 *
 * Can abort a fetch request, a [signal](https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal) is provided from the factory function to do so.
 *
 * ```ts
 * const result = usePromise(signal => fetch(`/api/products/${id}`, { signal }), [id])
 * ```
 *
 * @param factory Function that creates the promise.
 * @param deps If present, promise will be recreated if the values in the list change.
 */
export function usePromise<T>(
  factory: PromiseFactoryFn<T>,
  deps: DependencyList = []
): PromiseResult<T> {
  const [result, setResult] = useState<PromiseResult<T>>({ status: "pending" });

  useEffect(function effect() {
    if (result.status !== "pending") {
      setResult((s) => ({
        ...s,
        status: "pending"
      }));
    }

    const controller = new AbortController();
    const { signal } = controller;

    async function handlePromise() {
      const [promiseResult] = await Promise.allSettled([factory(signal)]);

      if (!signal.aborted) {
        setResult({ ...promiseResult, refresh: effect });
      }
    }

    handlePromise();

    return () => controller.abort();
  }, deps);

  return result;
}
