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

import {
  createElement,
  useSyncExternalStore,
  type ComponentType,
  type ReactElement
} from "react";

export interface BaseDialogProps<T = unknown> {
  onClose: (result: T) => void;
}

type PropsWithoutOnClose<Props extends BaseDialogProps<any>> = Omit<
  Props,
  "onClose"
>;

type DialogOptions<Props extends BaseDialogProps<any>> = {
  onBeforeOpen?: (
    props: PropsWithoutOnClose<Props>
  ) => boolean | Promise<boolean>;
};

type OpenedDialog = {
  component: ComponentType<any>;
  element: ReactElement;
  close: () => void;
};

let opened: OpenedDialog[] = [];
const listeners = new Set<() => void>();

function emit(next: OpenedDialog[]) {
  opened = next;
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

class _DialogManager {
  open<
    Props extends BaseDialogProps<any>,
    Result extends Props extends BaseDialogProps<infer T> ? T : unknown
  >(
    component: ComponentType<Props>,
    props: Omit<Props, "onClose">
  ): Promise<Result | false> {
    if (opened.some((dialog) => dialog.component === component))
      return Promise.resolve(false);

    return new Promise<Result | false>((resolve) => {
      const remove = () =>
        emit(opened.filter((dialog) => dialog.component !== component));
      const element = createElement(component as ComponentType<any>, {
        ...props,
        key: `dialog-${opened.length}-${Date.now()}`,
        onClose: (result: Result) => {
          remove();
          resolve(result);
        }
      });
      emit([
        ...opened,
        {
          component,
          element,
          close: () => {
            remove();
            resolve(false);
          }
        }
      ]);
    });
  }

  closeAll() {
    for (const dialog of [...opened]) dialog.close();
  }

  register<Props extends BaseDialogProps<any>>(
    component: ComponentType<Props>,
    options?: DialogOptions<Props>
  ) {
    return {
      show: async (props: PropsWithoutOnClose<Props>) => {
        if (options?.onBeforeOpen && !(await options.onBeforeOpen(props)))
          return false;
        return await this.open(component, props);
      },
      close: () => {
        opened.find((dialog) => dialog.component === component)?.close();
      }
    };
  }
}

export const DialogManager = new _DialogManager();

export function DialogHost() {
  const dialogs = useSyncExternalStore(subscribe, () => opened);
  return <>{dialogs.map((dialog) => dialog.element)}</>;
}
