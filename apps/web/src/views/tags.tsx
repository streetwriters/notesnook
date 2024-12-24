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
import useNavigate from "../hooks/use-navigate";
import Placeholder from "../components/placeholders";
import { useSearch } from "../hooks/use-search";
import { db } from "../common/db";
import { ListLoader } from "../components/loaders/list-loader";
import { useEffect } from "react";
import { navigate } from "../navigation";

type Props = {
  location: "middle-pane" | "sidebar";
};

function Tags({ location }: Props) {
  useNavigate("tags", () => store.refresh());
  const tags = useStore((store) => store.tags);
  const refresh = useStore((store) => store.refresh);
  const filteredItems = useSearch("tags", (query) =>
    db.lookup.tags(query).sorted()
  );

  useEffect(() => {
    if (location === "sidebar") return;
    tags?.item(0).then((item) => {
      if (item && item?.item) {
        navigate(`/tags/${item.item.id}`);
      }
    });
  }, [tags, location]);

  if (!tags) return <ListLoader />;
  return (
    <ListContainer
      refresh={refresh}
      items={filteredItems || tags}
      placeholder={<Placeholder context="tags" />}
    />
  );
}

export default Tags;
