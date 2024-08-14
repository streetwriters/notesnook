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

import { eSendEvent } from "../../services/event-manager";
import { eCloseSimpleDialog, eOpenSimpleDialog } from "../../utils/events";

type DialogInfo = {
  title?: string;
  paragraph?: string;
  positiveText?: string;
  negativeText?: string;
  positivePress?: (...args: any[]) => void;
  onClose?: () => void;
  positiveType?:
    | "transparent"
    | "plain"
    | "secondary"
    | "accent"
    | "inverted"
    | "shade"
    | "error"
    | "errorShade";
  icon?: string;
  paragraphColor: string;
  input: boolean;
  inputPlaceholder: string;
  defaultValue: string;
  // eslint-disable-next-line @typescript-eslint/ban-types
  context: "global" | "local" | (string & {});
  secureTextEntry?: boolean;
  keyboardType?: string;
  check?: {
    info: string;
    type?: string;
    defaultValue?: boolean;
  };
  notice: {
    text: string;
    type: "alert" | "information";
  };
};

export function presentDialog(data: Partial<DialogInfo>): void {
  eSendEvent(eOpenSimpleDialog, data);
}

export function hideDialog(): void {
  eSendEvent(eCloseSimpleDialog);
}
