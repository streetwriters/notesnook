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

import { useMemo } from "react";
import { useAreFeaturesAvailable } from "@notesnook/common";
import { useStore as useUserStore } from "../../stores/user-store";
import { deniedPermissionIds } from "@notesnook/ui-kit/shared/editor-bridge";

/**
 * The editor command ids the user's plan does not allow: the same checks
 * `apps/web` feeds to its permission handler (the plan's callout, outline
 * list and task list features, and being logged in for attachments).
 * `undefined` until the plan is known; it updates when the subscription does.
 */
export function useDeniedPermissions(): string[] | undefined {
  const features = useAreFeaturesAvailable([
    "callout",
    "outlineList",
    "taskList"
  ]);
  const isLoggedIn = useUserStore((state) => !!state.isLoggedIn);

  return useMemo(
    () =>
      features
        ? deniedPermissionIds({
            callout: !!features.callout?.isAllowed,
            outlineList: !!features.outlineList?.isAllowed,
            taskList: !!features.taskList?.isAllowed,
            insertAttachment: isLoggedIn
          })
        : undefined,
    [features, isLoggedIn]
  );
}
