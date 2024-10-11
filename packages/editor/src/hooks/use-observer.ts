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

import { useState, useRef, useEffect, useCallback } from "react";

type ObserverType = {
  threshold: number;
  rootMargin?: string;
  once?: boolean;
};

export function useObserver<T extends Element = Element>({
  threshold,
  rootMargin = "0px",
  once = false
}: ObserverType) {
  const [inView, setInView] = useState<boolean>();
  const ref = useRef<T>(null);
  const observer = useRef<IntersectionObserver>();

  const updateInView = useCallback(
    (val: boolean) => {
      if (inView && once) {
        return;
      }
      setInView(val);
    },
    [inView, once]
  );

  useEffect(() => {
    const options = {
      root: null,
      rootMargin: rootMargin,
      threshold: threshold
    };

    observer.current = new IntersectionObserver((entries) => {
      updateInView(entries[0].isIntersecting);
    }, options);
  });

  useEffect(() => {
    if (ref.current) {
      observer?.current?.observe(ref.current);
    }

    const reference = ref.current;

    return () => {
      if (reference) {
        observer.current?.unobserve(reference);
        observer.current?.disconnect();
      }
    };
  });

  return { inView, ref };
}
