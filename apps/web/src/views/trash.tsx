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
import { useStore, store } from "../stores/trash-store";
import { showToast } from "../utils/toast";
import useNavigate from "../hooks/use-navigate";
import Placeholder from "../components/placeholders";
import { useSearch } from "../hooks/use-search";
import { db } from "../common/db";
import { ListLoader } from "../components/loaders/list-loader";
import { ConfirmDialog } from "../dialogs/confirm";
import { strings } from "@notesnook/intl";

function Trash() {
  useNavigate("trash", store.refresh);
  const items = useStore((store) => store.trash);
  const refresh = useStore((store) => store.refresh);
  const clearTrash = useStore((store) => store.clear);
  const filteredItems = useSearch("trash", (query) =>
    db.lookup.trash(query).sorted()
  );

  if (!items) return <ListLoader />;
  return (
    <ListContainer
      group="trash"
      refresh={refresh}
      placeholder={<Placeholder context="trash" />}
      items={filteredItems || items}
      button={{
        onClick: function () {
          ConfirmDialog.show({
            title: strings.clearTrash(),
            subtitle: strings.clearTrashDesc(),
            positiveButtonText: strings.clear(),
            negativeButtonText: strings.cancel(),
            message: strings.areYouSure()
          }).then(async (res) => {
            if (res) {
              try {
                await clearTrash();
                showToast("success", strings.trashCleared());
              } catch (e) {
                if (e instanceof Error)
                  showToast(
                    "error",
                    `${strings.couldNotClearTrash()} ${strings.error()}: ${
                      e.message
                    }`
                  );
              }
            }
          });
        }
      }}
    />
  );
}
export default Trash;
