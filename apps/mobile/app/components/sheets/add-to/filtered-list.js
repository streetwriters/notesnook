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

import React, { useCallback, useEffect, useRef, useState } from "react";
import { FlashList } from "react-native-actions-sheet";
import { db } from "../../../common/database";
import { ListHeaderInputItem } from "./list-header-item.js";

export const FilteredList = ({
  data,
  itemType,
  onAddItem,
  hasHeaderSearch,
  listRef,
  ...restProps
}) => {
  const [filtered, setFiltered] = useState(data);
  const query = useRef();
  const onChangeText = useCallback(
    (value) => {
      query.current = value;
      try {
        if (!value) return setFiltered(data);
        const results = db.lookup[itemType + "s"]([...data], value);
        setFiltered(results);
      } catch (e) {
        console.warn(e.message);
      }
    },
    [data, itemType]
  );
  const onSubmit = async (value) => {
    return await onAddItem(value);
  };

  useEffect(() => {
    onChangeText(query.current);
  }, [data, onChangeText]);

  return (
    <FlashList
      {...restProps}
      data={filtered}
      ref={listRef}
      ListHeaderComponent={
        hasHeaderSearch ? (
          <ListHeaderInputItem
            onSubmit={onSubmit}
            onChangeText={onChangeText}
            itemType={itemType}
            testID={"list-input" + itemType}
            placeholder={`Search or add a new ${itemType}`}
          />
        ) : null
      }
      keyboardShouldPersistTaps="always"
      keyboardDismissMode="none"
    />
  );
};
