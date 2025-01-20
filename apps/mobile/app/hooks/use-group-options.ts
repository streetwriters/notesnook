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
import { useEffect, useState } from "react";
import { db } from "../common/database";
import { eSubscribeEvent, eUnSubscribeEvent } from "../services/event-manager";
import Navigation from "../services/navigation";
import { eGroupOptionsUpdated } from "../utils/events";

export function useGroupOptions(type: any) {
  const [groupOptions, setGroupOptions] = useState(
    db.settings?.getGroupOptions(type)
  );

  useEffect(() => {
    const onUpdate = (groupType: string) => {
      if (groupType !== type) return;
      const options = db.settings?.getGroupOptions(type) as any;

      if (
        groupOptions?.groupBy !== options.groupBy ||
        groupOptions?.sortBy !== options.sortBy ||
        groupOptions?.sortDirection !== groupOptions?.sortDirection
      ) {
        setGroupOptions({ ...options });
        Navigation.queueRoutesForUpdate();
      }
    };

    eSubscribeEvent(eGroupOptionsUpdated, onUpdate);
    return () => {
      eUnSubscribeEvent(eGroupOptionsUpdated, onUpdate);
    };
  }, [type, groupOptions]);

  return groupOptions;
}
