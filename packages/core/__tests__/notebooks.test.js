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

import { notebookTest, TEST_NOTEBOOK } from "./utils/index.ts";
import { test, expect } from "vitest";

test("add a notebook", () =>
  notebookTest().then(async ({ db, id }) => {
    expect(id).toBeDefined();
    const notebook = await db.notebooks.notebook(id);
    expect(notebook).toBeDefined();
    expect(notebook.title).toBe(TEST_NOTEBOOK.title);
  }));

test("get all notebooks", () =>
  notebookTest().then(async ({ db }) => {
    expect(await db.notebooks.all.count()).toBeGreaterThan(0);
  }));

test("pin a notebook", () =>
  notebookTest().then(async ({ db, id }) => {
    await db.notebooks.pin(true, id);
    const notebook = await db.notebooks.notebook(id);
    expect(notebook.pinned).toBe(true);
  }));

test("unpin a notebook", () =>
  notebookTest().then(async ({ db, id }) => {
    await db.notebooks.pin(false, id);
    const notebook = await db.notebooks.notebook(id);
    expect(notebook.pinned).toBe(false);
  }));

test("updating notebook with empty title should throw", () =>
  notebookTest().then(async ({ db, id }) => {
    await expect(db.notebooks.add({ id, title: "" })).rejects.toThrow();
  }));

test("parentId() returns parentId if notebook is a subnotebook", () =>
  notebookTest().then(async ({ db, id }) => {
    const subId = await db.notebooks.add({ title: "Sub", id });
    await db.relations.add(
      { type: "notebook", id },
      { type: "notebook", id, subId }
    );
    expect(await db.notebooks.parentId(subId)).toBe(id);
  }));

test("parentId() returns undefined if notebook is not a subnotebook", () =>
  notebookTest().then(async ({ db, id }) => {
    expect(await db.notebooks.parentId(id)).toBeUndefined();
  }));

test("repairCircularReferences() returns false when there are no notebooks", () =>
  notebookTest().then(async ({ db, id }) => {
    await db.notebooks.moveToTrash(id);
    expect(await db.notebooks.repairCircularReferences()).toBe(false);
  }));

test("repairCircularReferences() returns false when there are no cycles", () =>
  notebookTest().then(async ({ db, id: parentId }) => {
    const childId = await db.notebooks.add({ title: "Child" });
    await db.relations.add(
      { type: "notebook", id: parentId },
      { type: "notebook", id: childId }
    );
    expect(await db.notebooks.repairCircularReferences()).toBe(false);
  }));

test("repairCircularReferences() repairs a direct 2-node cycle (A → B → A)", () =>
  notebookTest().then(async ({ db, id: idA }) => {
    const idB = await db.notebooks.add({ title: "B" });
    // A is parent of B, B is parent of A  →  cycle
    await db.relations.add(
      { type: "notebook", id: idA },
      { type: "notebook", id: idB }
    );
    await db.relations.add(
      { type: "notebook", id: idB },
      { type: "notebook", id: idA }
    );

    // Both disappear from roots due to the cycle
    expect(await db.notebooks.roots.count()).toBe(0);

    const repaired = await db.notebooks.repairCircularReferences();
    expect(repaired).toBe(true);

    // After repair both notebooks are visible as roots again
    const rootIds = await db.notebooks.roots.ids();
    expect(rootIds).toContain(idA);
    expect(rootIds).toContain(idB);
  }));

test("repairCircularReferences() repairs an isolated sub-cycle alongside a valid tree", () =>
  notebookTest().then(async ({ db, id: rootId }) => {
    // Valid tree: root → child
    const childId = await db.notebooks.add({ title: "Child" });
    await db.relations.add(
      { type: "notebook", id: rootId },
      { type: "notebook", id: childId }
    );

    // Isolated cycle: B ↔ C (no connection to the valid tree)
    const idB = await db.notebooks.add({ title: "B" });
    const idC = await db.notebooks.add({ title: "C" });
    await db.relations.add(
      { type: "notebook", id: idB },
      { type: "notebook", id: idC }
    );
    await db.relations.add(
      { type: "notebook", id: idC },
      { type: "notebook", id: idB }
    );

    // Only the genuine root is visible; B and C are hidden in their cycle
    const rootsBefore = await db.notebooks.roots.ids();
    expect(rootsBefore).toContain(rootId);
    expect(rootsBefore).not.toContain(idB);
    expect(rootsBefore).not.toContain(idC);

    const repaired = await db.notebooks.repairCircularReferences();
    expect(repaired).toBe(true);

    const rootsAfter = await db.notebooks.roots.ids();
    // The valid tree is untouched
    expect(rootsAfter).toContain(rootId);
    expect(rootsAfter).not.toContain(childId);
    // The formerly-cyclic notebooks are now roots
    expect(rootsAfter).toContain(idB);
    expect(rootsAfter).toContain(idC);
  }));

test("repairCircularReferences() handles a longer cycle (A → B → C → A)", () =>
  notebookTest().then(async ({ db, id: idA }) => {
    const idB = await db.notebooks.add({ title: "B" });
    const idC = await db.notebooks.add({ title: "C" });
    await db.relations.add(
      { type: "notebook", id: idA },
      { type: "notebook", id: idB }
    );
    await db.relations.add(
      { type: "notebook", id: idB },
      { type: "notebook", id: idC }
    );
    await db.relations.add(
      { type: "notebook", id: idC },
      { type: "notebook", id: idA }
    );

    expect(await db.notebooks.roots.count()).toBe(0);

    expect(await db.notebooks.repairCircularReferences()).toBe(true);

    const rootIds = await db.notebooks.roots.ids();
    expect(rootIds).toContain(idA);
    expect(rootIds).toContain(idB);
    expect(rootIds).toContain(idC);
  }));
