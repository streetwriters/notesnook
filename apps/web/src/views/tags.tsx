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

import ListContainer from "../components/list-container";
import { useStore, store } from "../stores/tag-store";
import Placeholder from "../components/placeholders";
import { db } from "../common/db";
import { ListLoader } from "../components/loaders/list-loader";
import { Flex, Input } from "@theme-ui/components";
import { forwardRef, useEffect, useState } from "react";
import { debounce } from "@notesnook/common";
import { Tag, VirtualizedGrouping } from "@notesnook/core";
import ScrollContainer from "../components/scroll-container";
import { ScrollerProps } from "react-virtuoso";
import { SidebarScroller } from "../components/sidebar-scroller";

function Tags() {
  const tags = useStore((store) => store.tags);
  const refresh = useStore((store) => store.refresh);
  const [filteredTags, setFilteredTags] = useState<VirtualizedGrouping<Tag>>();
  const items = filteredTags || tags;

  useEffect(() => {
    store.refresh();
  }, []);

  if (!items) return <ListLoader />;
  return (
    <Flex
      variant="columnFill"
      id="tags"
      sx={{
        flex: 1,
        '[data-viewport-type="element"]': {
          px: 1,
          width: `calc(100% - ${2 * 6}px) !important`
        }
      }}
    >
      <ListContainer
        type="tags"
        refresh={refresh}
        items={items}
        placeholder={<Placeholder context="tags" />}
        header={<></>}
        Scroller={SidebarScroller}
      />
      <Input
        variant="clean"
        placeholder="Filter tags..."
        sx={{ borderTop: "1px solid var(--border)", mx: 0 }}
        onChange={debounce(async (e) => {
          const query = e.target.value.trim();
          setFilteredTags(
            query ? await db.lookup.tags(query).sorted() : undefined
          );
        }, 300)}
      />
    </Flex>
  );
}

export default Tags;
