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

// React's types, with the DOM-only ones replaced by the kit's. A file shared
// with apps/web that writes `React.KeyboardEvent<HTMLDivElement>` or
// `React.CSSProperties` imports this as its `React` namespace on desktop:
//
//   import type * as React from "@notesnook/ui-kit/contracts/react";
//
// so the code below the imports stays as apps/web has it. Type-only: there is
// nothing here at runtime.

import type {
  UIChangeEvent,
  UIClipboardEvent,
  UIDragEvent,
  UIFocusEvent,
  UIFormEvent,
  UIKeyboardEvent,
  UIMouseEvent,
  UISyntheticEvent,
  UIWheelEvent
} from "./events";
import type { UIElement } from "./elements";
import type { StyleProp } from "./style";

import type * as R from "react";

export type ReactNode = R.ReactNode;
export type ReactElement = R.ReactElement;
export type Ref<T> = R.Ref<T>;
export type LegacyRef<T> = R.LegacyRef<T>;
export type RefObject<T> = R.RefObject<T>;
export type MutableRefObject<T> = R.MutableRefObject<T>;
export type ForwardedRef<T> = R.ForwardedRef<T>;
export type PropsWithChildren<P = unknown> = R.PropsWithChildren<P>;
export type ComponentType<P = object> = R.ComponentType<P>;
export type ComponentProps<
  T extends keyof R.JSX.IntrinsicElements | R.JSXElementConstructor<any>
> = R.ComponentProps<T>;
export type FunctionComponent<P = object> = R.FunctionComponent<P>;
export type FC<P = object> = R.FC<P>;
export type JSXElementConstructor<P> = R.JSXElementConstructor<P>;
export type MemoExoticComponent<T extends ComponentType<any>> =
  R.MemoExoticComponent<T>;
export type Dispatch<A> = R.Dispatch<A>;
export type SetStateAction<S> = R.SetStateAction<S>;
export type Key = R.Key;


export type CSSProperties = StyleProp;
export type SyntheticEvent<T = UIElement> = UISyntheticEvent<T>;
export type MouseEvent<T = UIElement> = UIMouseEvent<T>;
export type KeyboardEvent<T = UIElement> = UIKeyboardEvent<T>;
export type DragEvent<T = UIElement> = UIDragEvent<T>;
export type FocusEvent<T = UIElement> = UIFocusEvent<T>;
export type WheelEvent<T = UIElement> = UIWheelEvent<T>;
export type ClipboardEvent<T = UIElement> = UIClipboardEvent<T>;
export type FormEvent<T = UIElement> = UIFormEvent<T>;
export type ChangeEvent<T = UIChangeEvent["currentTarget"]> =
  UIChangeEvent<T>;
export type MouseEventHandler<T = UIElement> = (event: UIMouseEvent<T>) => void;
export type DragEventHandler<T = UIElement> = (event: UIDragEvent<T>) => void;
