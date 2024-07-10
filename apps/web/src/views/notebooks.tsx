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
import { useStore, store } from "../stores/notebook-store";
import { hashNavigate } from "../navigation";
import Placeholder from "../components/placeholders";
import { useEffect } from "react";
import { db } from "../common/db";
import { useSearch } from "../hooks/use-search";
import { ListLoader } from "../components/loaders/list-loader";

function Notebooks() {
  const notebooks = useStore((state) => state.notebooks);
  const refresh = useStore((state) => state.refresh);
  const filteredItems = useSearch("notebooks", (query) =>
    db.lookup.notebooks(query).sorted()
  );
  const isCompact = useStore((store) => store.viewMode === "compact");

  useEffect(() => {
    store.get().refresh();
  }, []);

  if (!notebooks) return <ListLoader />;
  return (
    <>
      <ListContainer
        group="notebooks"
        refresh={refresh}
        items={filteredItems || notebooks}
        placeholder={<Placeholder context="notebooks" />}
        compact={isCompact}
        button={{
          onClick: () => hashNavigate("/notebooks/create")
        }}
      />
    </>
  );
}

export default Notebooks;
