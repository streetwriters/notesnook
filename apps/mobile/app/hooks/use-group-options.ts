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
import { useEffect, useRef, useState } from "react";
import { db } from "../common/database";
import { eSubscribeEvent, eUnSubscribeEvent } from "../services/event-manager";
import Navigation from "../services/navigation";
import { eGroupOptionsUpdated } from "../utils/events";
import { useSettingStore } from "../stores/use-setting-store";
import { GroupingByIdKey, GroupingKey, GroupOptions } from "@notesnook/core";

export function getGroupOptions(
  groupingKey: GroupingKey,
  id?: string,
  type?: GroupingByIdKey
) {
  return id && type
    ? db.settings?.getGroupOptionsById(id, type)
    : db.settings?.getGroupOptions(groupingKey);
}

export function setGroupOptionsById(
  groupingKey: GroupingKey,
  groupOptions: GroupOptions,
  id?: string,
  type?: GroupingByIdKey
) {
  return id && type
    ? db.settings?.setGroupOptionsById(id, type, groupOptions)
    : db.settings?.setGroupOptions(groupingKey, groupOptions);
}

export function useGroupOptions(
  groupingKey: GroupingKey,
  id?: string,
  type?: GroupingByIdKey
) {
  const appLoading = useSettingStore((state) => state.isAppLoading);
  const [groupOptions, setGroupOptions] = useState(
    getGroupOptions(groupingKey, id, type)
  );
  console.log(groupingKey, id, type, groupOptions, "options");
  const groupOptionsRef = useRef(groupOptions);
  groupOptionsRef.current = groupOptions;

  useEffect(() => {
    const onUpdate = (_groupingKey: string, _id?: string, _type?: string) => {
      if (_groupingKey !== groupingKey) return;
      if (_id && _type && _id !== id && _type !== type) return;

      const options = getGroupOptions(groupingKey, id, type);
      if (!options) return;
      if (
        groupOptionsRef.current?.groupBy !== options.groupBy ||
        groupOptionsRef.current?.sortBy !== options.sortBy ||
        groupOptionsRef.current?.sortDirection !== options?.sortDirection
      ) {
        console.log("onUpdate", _id, _type);
        setGroupOptions({ ...options });
        Navigation.queueRoutesForUpdate();
      }
    };

    eSubscribeEvent(eGroupOptionsUpdated, onUpdate);

    if (!appLoading) {
      onUpdate(groupingKey);
    }

    return () => {
      eUnSubscribeEvent(eGroupOptionsUpdated, onUpdate);
    };
  }, [groupingKey, appLoading, id, type]);

  return groupOptions;
}
