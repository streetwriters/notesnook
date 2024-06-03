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
import { useStore, store } from "../stores/reminder-store";
import { hashNavigate } from "../navigation";
import useNavigate from "../hooks/use-navigate";
import Placeholder from "../components/placeholders";
import { db } from "../common/db";
import { useSearch } from "../hooks/use-search";
import { ListLoader } from "../components/loaders/list-loader";

function Reminders() {
  useNavigate("reminders", () => store.refresh());
  const reminders = useStore((state) => state.reminders);
  const refresh = useStore((state) => state.refresh);
  const filteredItems = useSearch("reminders", (query) =>
    db.lookup.reminders(query).sorted()
  );

  if (!reminders) return <ListLoader />;
  return (
    <>
      <ListContainer
        group="reminders"
        refresh={refresh}
        items={filteredItems || reminders}
        placeholder={<Placeholder context="reminders" />}
        button={{
          onClick: () => hashNavigate("/reminders/create")
        }}
      />
    </>
  );
}

export default Reminders;
