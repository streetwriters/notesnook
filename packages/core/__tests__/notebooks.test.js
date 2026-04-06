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

test("repairCircularReferences() does not alter a deep valid hierarchy", () =>
  notebookTest().then(async ({ db, id: rootId }) => {
    // root → A → B → C  (3 levels deep, no cycles)
    const idA = await db.notebooks.add({ title: "A" });
    const idB = await db.notebooks.add({ title: "B" });
    const idC = await db.notebooks.add({ title: "C" });
    await db.relations.add(
      { type: "notebook", id: rootId },
      { type: "notebook", id: idA }
    );
    await db.relations.add(
      { type: "notebook", id: idA },
      { type: "notebook", id: idB }
    );
    await db.relations.add(
      { type: "notebook", id: idB },
      { type: "notebook", id: idC }
    );

    expect(await db.notebooks.repairCircularReferences()).toBe(false);

    // Structure is completely untouched
    const rootIds = await db.notebooks.roots.ids();
    expect(rootIds).toEqual([rootId]);
    expect(await db.notebooks.parentId(idA)).toBe(rootId);
    expect(await db.notebooks.parentId(idB)).toBe(idA);
    expect(await db.notebooks.parentId(idC)).toBe(idB);
  }));

test("repairCircularReferences() does not alter a wide valid tree (multiple roots, multiple children)", () =>
  notebookTest().then(async ({ db, id: root1 }) => {
    // root1 → [child1, child2]
    // root2 → [child3]
    const root2 = await db.notebooks.add({ title: "Root 2" });
    const child1 = await db.notebooks.add({ title: "Child 1" });
    const child2 = await db.notebooks.add({ title: "Child 2" });
    const child3 = await db.notebooks.add({ title: "Child 3" });

    await db.relations.add(
      { type: "notebook", id: root1 },
      { type: "notebook", id: child1 }
    );
    await db.relations.add(
      { type: "notebook", id: root1 },
      { type: "notebook", id: child2 }
    );
    await db.relations.add(
      { type: "notebook", id: root2 },
      { type: "notebook", id: child3 }
    );

    expect(await db.notebooks.repairCircularReferences()).toBe(false);

    const rootIds = await db.notebooks.roots.ids();
    expect(rootIds).toContain(root1);
    expect(rootIds).toContain(root2);
    expect(rootIds).not.toContain(child1);
    expect(rootIds).not.toContain(child2);
    expect(rootIds).not.toContain(child3);

    expect(await db.notebooks.parentId(child1)).toBe(root1);
    expect(await db.notebooks.parentId(child2)).toBe(root1);
    expect(await db.notebooks.parentId(child3)).toBe(root2);
  }));

test("roots are correct when a parent relation exists but the parent notebook has not yet synced (partial sync)", () =>
  notebookTest().then(async ({ db, id: childId }) => {
    // Simulate a relation record arriving before the parent notebook itself:
    // inject a relation with a fromId that doesn't exist in the notebooks table.
    const ghostParentId = "non-existent-parent-id";
    await db.relations.add(
      { type: "notebook", id: ghostParentId },
      { type: "notebook", id: childId }
    );

    // The child must not appear as a root — its "parent" is not a real notebook yet.
    const rootIds = await db.notebooks.roots.ids();
    expect(rootIds).toStrictEqual([]);
  }));

test("repairCircularReferences() does not disturb notebooks with a dangling parent relation (partial sync)", () =>
  notebookTest().then(async ({ db, id: childId }) => {
    // Inject a relation with a fromId that doesn't exist in notebooks yet.
    await db.relations.add(
      { type: "notebook", id: "ghost-parent" },
      { type: "notebook", id: childId }
    );

    // The dangling relation looks like an orphan but is NOT a cycle —
    // repairCircularReferences() must leave it untouched.
    expect(await db.notebooks.repairCircularReferences()).toBe(true);

    const rootIds = await db.notebooks.roots.ids();
    expect(rootIds).toContain(childId);
  }));

test("repairCircularReferences() repairs a direct 2-node cycle (A → B → A)", () =>
  notebookTest().then(async ({ db, id: idA }) => {
    const idB = await db.notebooks.add({ title: "B" });
    const idC = await db.notebooks.add({ title: "C" });
    // A is parent of B, B is parent of A  →  cycle
    await db.relations.add(
      { type: "notebook", id: idA },
      { type: "notebook", id: idB }
    );
    await db.relations.add(
      { type: "notebook", id: idB },
      { type: "notebook", id: idA }
    );

    // Both disappear from roots due to the cycle but other notebooks (like C) are unaffected
    expect(await db.notebooks.roots.count()).toBe(1);

    const repaired = await db.notebooks.repairCircularReferences();
    expect(repaired).toBe(true);

    // After repair both notebooks are visible as roots again
    const rootIds = await db.notebooks.roots.ids();
    expect(rootIds).toContain(idA);
    expect(rootIds).toContain(idB);
    expect(rootIds).toContain(idC);
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
