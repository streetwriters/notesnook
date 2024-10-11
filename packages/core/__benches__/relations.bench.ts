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

import { describe } from "vitest";
import { databaseTest } from "../__tests__/utils/index.js";

describe("relations", async () => {
  const db = await databaseTest();
  //  const totalNotebooks = 10;

  // let parentNotebookId: string | undefined = undefined;
  // for (let i = 1; i <= 100; ++i) {
  //   const id = await db.notebooks.add({ title: `notebook-somethign-${i}` });
  //   if (parentNotebookId)
  //     await db.relations.add(
  //       { id: parentNotebookId, type: "notebook" },
  //       { id, type: "notebook" }
  //     );
  //   parentNotebookId = id;
  //   for (let j = 1; j <= 100; ++j) {
  //     await db.relations.add(
  //       { type: "notebook", id },
  //       { id: `${j * i}-note`, type: "note" }
  //     );
  //   }
  // }

  //

  // const id2 = await db.notebooks.add({ title: `notebook-somethign` });

  console.log(await db.notebooks.totalNotes("6516a04a35a073f359e7e801"));

  // console.log(
  //   await db.relations.from({ id: "8-note", type: "note" }, "notebook").unlink()
  // );

  // bench("get some relations from 10k relations", async () => {
  //   await db.notebooks.totalNotes("6516a04a35a073f359e7e801");
  // });
});
