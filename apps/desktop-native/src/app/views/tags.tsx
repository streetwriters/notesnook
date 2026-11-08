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
import { debounce } from "@notesnook/common";
import type { Tag, VirtualizedGrouping } from "@notesnook/core";
import { strings } from "@notesnook/intl";
import { Flex } from "@ui";
import ListContainer from "../components/list-container";
import { SidebarPlaceholder } from "../components/placeholders";
import { ListLoader } from "../components/loaders/list-loader";
import { FilterField } from "../components/navigation-menu/filter-field";
import { db } from "../common/db";
import { useStore, store } from "../stores/tag-store";

function Tags() {
  const tags = useStore((store) => store.tags);
  const refresh = useStore((store) => store.refresh);
  const [filteredTags, setFilteredTags] = useState<VirtualizedGrouping<Tag>>();
  const query = useRef("");
  const items = filteredTags || tags;

  useEffect(() => {
    store.refresh();
  }, []);

  useEffect(() => {
    if (!query.current) return;
    (async () => {
      setFilteredTags(await db.lookup.tags(query.current).sorted());
    })();
  }, [tags]);

  const onFilter = useRef(
    debounce(async (text: string) => {
      query.current = text.trim();
      setFilteredTags(
        query.current ? await db.lookup.tags(query.current).sorted() : undefined
      );
    }, 300)
  ).current;

  if (!items) return <ListLoader />;
  return (
    <Flex
      testID="tags"
      sx={{ flexDirection: "column", flex: 1, mt: "spacing4" }}
    >
      <ListContainer
        type="tags"
        refresh={refresh}
        items={items}
        placeholder={<SidebarPlaceholder variant="tags" />}
        placeholderSx={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center"
        }}
        header={<></>}
      />
      <FilterField placeholder={strings.filterTags()} onChangeText={onFilter} />
    </Flex>
  );
}
export default Tags;
