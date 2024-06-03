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

import React, { useEffect } from "react";
import { useStore } from "../stores/note-store";
import ListContainer from "../components/list-container";
import useNavigate from "../hooks/use-navigate";
import Placeholder from "../components/placeholders";
import { useSearch } from "../hooks/use-search";
import { db } from "../common/db";
import { useEditorStore } from "../stores/editor-store";
import { ListLoader } from "../components/loaders/list-loader";

function Home() {
  const notes = useStore((store) => store.notes);
  const isCompact = useStore((store) => store.viewMode === "compact");
  const refresh = useStore((store) => store.refresh);
  const setContext = useStore((store) => store.setContext);
  const filteredItems = useSearch("notes", (query) => {
    if (useStore.getState().context) return;
    return db.lookup.notes(query).sorted();
  });

  useNavigate("home", setContext);

  useEffect(() => {
    useStore.getState().refresh();
  }, []);

  // useEffect(() => {
  //   (async function () {

  //     // const titles =
  //     //   "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz".split("");
  //     // for (let i = 0; i < 10000; ++i) {
  //     //   await db.notes.add({
  //     //     title: `${
  //     //       titles[getRandom(0, titles.length)]
  //     //     } Some other title of mine`
  //     //   });
  //     //   if (i % 100 === 0) console.log(i);
  //     // }
  //     // console.log("DONE");
  //   })();
  // }, []);

  if (!notes) return <ListLoader />;
  return (
    <ListContainer
      group="home"
      compact={isCompact}
      refresh={refresh}
      items={filteredItems || notes}
      placeholder={<Placeholder context="notes" />}
      button={{
        onClick: () => useEditorStore.getState().newSession()
      }}
    />
  );
}
export default React.memo(Home, () => true);
