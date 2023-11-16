import { db } from "../common/database";

export async function findRootNotebookId(id: string) {
  const relation = await db.relations
    .to(
      {
        id,
        type: "notebook"
      },
      "notebook"
    )
    .get();
  if (!relation || !relation.length) {
    return id;
  } else {
    return findRootNotebookId(relation[0].fromId);
  }
}

export async function getParentNotebookId(id: string) {
  const relation = await db.relations
    .to(
      {
        id,
        type: "notebook"
      },
      "notebook"
    )
    .get();

  return relation?.[0]?.fromId;
}
