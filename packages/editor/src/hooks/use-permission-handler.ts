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

import { UnionCommands } from "@tiptap/core";
import { useEffect } from "react";
import { PermissionRequestEvent } from "../types.js";

export type Claims = "premium";
export type PermissionHandlerOptions = {
  claims: Record<Claims, boolean>;
  onPermissionDenied: (claim: Claims, id: keyof UnionCommands) => void;
};

const ClaimsMap: Record<Claims, (keyof UnionCommands)[]> = {
  premium: ["insertImage", "insertAttachment"]
};

export function usePermissionHandler(options: PermissionHandlerOptions) {
  const { claims, onPermissionDenied } = options;

  useEffect(() => {
    function onPermissionRequested(ev: Event) {
      const {
        detail: { id }
      } = ev as PermissionRequestEvent;

      for (const key in ClaimsMap) {
        const claim = key as Claims;
        const commands = ClaimsMap[claim];

        if (commands.indexOf(id) <= -1) continue;
        if (claims[claim]) continue;

        onPermissionDenied(claim, id);
        ev.preventDefault();
        break;
      }
    }
    window.addEventListener("permissionrequest", onPermissionRequested);
    return () => {
      window.removeEventListener("permissionrequest", onPermissionRequested);
    };
  }, [claims, onPermissionDenied]);
}
