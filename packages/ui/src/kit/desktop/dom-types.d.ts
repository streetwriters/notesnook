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

// Desktop is type-checked without the DOM library, so the DOM element names
// apps/web writes (`useRef<HTMLDivElement>`) are only the empty stand-ins
// @types/react declares. Here they become what a kit ref really is on desktop,
// so a shared file can name them unchanged.

import type {
  UIElement,
  UIInputElement,
  UITextAreaElement
} from "../contracts/elements";

declare global {
  /** The kit's polyfill (intersection-observer.ts), measured against the window. */
  class IntersectionObserver {
    constructor(
      callback: (
        entries: {
          target: UIElement;
          isIntersecting: boolean;
          intersectionRatio: number;
        }[],
        observer: IntersectionObserver
      ) => void,
      options?: { threshold?: number | number[]; rootMargin?: string }
    );
    observe(target: UIElement): void;
    unobserve(target: UIElement): void;
    disconnect(): void;
  }
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  interface HTMLElement extends UIElement {}
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  interface HTMLInputElement extends UIInputElement {}
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  interface HTMLTextAreaElement extends UITextAreaElement {}
}

export {};
