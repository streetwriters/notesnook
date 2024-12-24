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

import { useStore, store } from "../stores/notebook-store";
import { navigate } from "../navigation";
import Placeholder from "../components/placeholders";
import { useEffect } from "react";
import { ListLoader } from "../components/loaders/list-loader";
import { Flex } from "@theme-ui/components";

function Notebooks() {
  const notebooks = useStore((state) => state.notebooks);

  useEffect(() => {
    store.get().refresh();

    if (notebooks && notebooks.length > 0) {
      notebooks.item(0).then((item) => {
        if (item && item?.item) {
          navigate(`/notebooks/${item.item.id}`);
        }
      });
    }
  }, [notebooks]);

  if (!notebooks) return <ListLoader />;

  if (notebooks.length === 0) {
    return (
      <Flex variant="columnFill" sx={{ overflow: "hidden" }}>
        <Flex variant="columnCenterFill">
          <Placeholder context="notebooks" />
        </Flex>
      </Flex>
    );
  }

  return null;
}

export default Notebooks;
