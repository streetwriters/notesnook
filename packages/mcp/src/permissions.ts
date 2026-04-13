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

import { Database } from "@notesnook/core";
import { readFileSync, writeFileSync, existsSync } from "fs";
import path from "path";

export type Permission = "read" | "write" | "delete";
export type GrantTargetType = "notebook" | "tag" | "note";

export interface Grant {
  id: string;
  targetType: GrantTargetType;
  targetId: string;
  targetName: string;
  permissions: Permission[];
  createdAt: number;
}

export class PermissionStore {
  private grants: Grant[] = [];
  private readonly filePath: string;

  constructor(dataDir: string) {
    this.filePath = path.join(dataDir, "permissions.json");
    this.load();
  }

  private load(): void {
    if (!existsSync(this.filePath)) return;
    try {
      this.grants = JSON.parse(readFileSync(this.filePath, "utf8")) as Grant[];
    } catch {
      this.grants = [];
    }
  }

  private save(): void {
    writeFileSync(this.filePath, JSON.stringify(this.grants, null, 2), "utf8");
  }

  grant(
    targetType: GrantTargetType,
    targetId: string,
    targetName: string,
    permissions: Permission[]
  ): Grant {
    const existing = this.grants.find(
      (g) => g.targetType === targetType && g.targetId === targetId
    );
    if (existing) {
      existing.permissions = permissions;
      existing.targetName = targetName;
      this.save();
      return existing;
    }

    const g: Grant = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      targetType,
      targetId,
      targetName,
      permissions,
      createdAt: Date.now()
    };
    this.grants.push(g);
    this.save();
    return g;
  }

  revoke(grantId: string): boolean {
    const before = this.grants.length;
    this.grants = this.grants.filter((g) => g.id !== grantId);
    if (this.grants.length !== before) {
      this.save();
      return true;
    }
    return false;
  }

  list(): Grant[] {
    return [...this.grants];
  }

  async checkAccess(
    db: Database,
    noteId: string,
    operation: Permission
  ): Promise<boolean> {
    if (this.grants.length === 0) return false;

    // Collect all grants that cover this note
    const matchingGrants: Grant[] = [];

    for (const grant of this.grants) {
      if (grant.targetType === "note" && grant.targetId === noteId) {
        matchingGrants.push(grant);
        continue;
      }
      if (grant.targetType === "notebook") {
        const inNotebook = await noteIsInNotebook(db, noteId, grant.targetId);
        if (inNotebook) matchingGrants.push(grant);
        continue;
      }
      if (grant.targetType === "tag") {
        const hasTag = await noteHasTag(db, noteId, grant.targetId);
        if (hasTag) matchingGrants.push(grant);
      }
    }

    if (matchingGrants.length === 0) return false;

    // Least permissive wins: the operation must be in ALL matching grants
    const allowed = matchingGrants.every((g) =>
      g.permissions.includes(operation)
    );

    if (!allowed) return false;

    // Write/delete blocked on readonly notes
    if (operation === "write" || operation === "delete") {
      const note = await db.notes.note(noteId);
      if (note?.readonly) return false;
    }

    return true;
  }
}

async function noteIsInNotebook(
  db: Database,
  noteId: string,
  notebookId: string
): Promise<boolean> {
  const relations = await db.relations
    .from({ id: notebookId, type: "notebook" }, "note")
    .get();
  return relations.some((r) => r.toId === noteId);
}

async function noteHasTag(
  db: Database,
  noteId: string,
  tagId: string
): Promise<boolean> {
  const relations = await db.relations
    .from({ id: tagId, type: "tag" }, "note")
    .get();
  return relations.some((r) => r.toId === noteId);
}

export async function withPermissionCheck<T>(
  db: Database,
  store: PermissionStore,
  noteId: string,
  operation: Permission,
  fn: () => Promise<T>
): Promise<T | { error: string }> {
  const allowed = await store.checkAccess(db, noteId, operation);
  if (!allowed) {
    return {
      error: `Permission denied: '${operation}' access not granted for note ${noteId}`
    };
  }
  return fn();
}
