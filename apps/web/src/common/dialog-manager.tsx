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

import React from "react";
import { createRoot } from "react-dom/client";

export interface BaseDialogProps<T = unknown> {
  onClose: (result: T) => void;
}

class _DialogManager {
  private openedDialogs: Set<React.JSXElementConstructor<any>> = new Set();

  open<
    Props extends BaseDialogProps<any>,
    Result extends Props extends BaseDialogProps<infer T> ? T : unknown
  >(
    component: React.ComponentType<Props>,
    props: Omit<Props, "onClose">
  ): Promise<Result | false> {
    if (this.openedDialogs.has(component)) return Promise.resolve(false);

    const container = document.createElement("div");
    const root = createRoot(container);

    const close = () => {
      this.openedDialogs.delete(component);
      root.unmount();
      container.remove();
    };

    const Dialog = component as React.FunctionComponent<
      Omit<Props, "onClose"> & {
        onClose: (result: any) => void;
      }
    >;
    this.openedDialogs.add(component);
    return new Promise<Result>((resolve, reject) =>
      root.render(
        <Dialog
          {...props}
          onClose={(result: Result) => {
            try {
              close();
              resolve(result);
            } catch (e) {
              reject(e);
            }
          }}
        />
      )
    );
  }

  closeAll() {
    this.openedDialogs.clear();
    const dialogs = document.querySelectorAll(
      ".ReactModalPortal,[data-react-modal-body-trap]"
    );
    dialogs.forEach((elem) => elem.remove());
  }

  register<Props extends BaseDialogProps<any>>(
    component: React.ComponentType<Props>
  ) {
    return {
      show: (props: Omit<Props, "onClose">) => this.open(component, props)
    };
  }
}

export const DialogManager = new _DialogManager();
