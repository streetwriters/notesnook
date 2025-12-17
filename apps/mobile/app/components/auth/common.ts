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

import { createRef } from "react";
import { eSendEvent } from "../../services/event-manager";
import { eCloseLoginDialog } from "../../utils/events";
import Navigation from "../../services/navigation";
import { AuthParams } from "../../stores/use-navigation-store";
export const AuthMode = {
  login: 0,
  signup: 1,
  welcomeSignup: 2,
  welcomeLogin: 3,
  trialSignup: 4
};

export const initialAuthMode = createRef<number>();
initialAuthMode.current = AuthMode.login;
export function hideAuth(context?: AuthParams["context"]) {
  eSendEvent(eCloseLoginDialog);
  if (
    initialAuthMode.current === AuthMode.welcomeSignup ||
    initialAuthMode.current === AuthMode.welcomeLogin ||
    context === "intro"
  ) {
    Navigation.replace("FluidPanelsView", {});
  } else {
    Navigation.goBack();
  }
}
