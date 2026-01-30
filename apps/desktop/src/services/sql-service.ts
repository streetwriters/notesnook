import { SQLite } from "../api/sqlite-kysely";

import { EventEmitter } from "events";

class SqlService extends EventEmitter {
  private connections: Map<string, { db: SQLite; refCount: number }> =
    new Map();

  constructor() {
    super();
  }

  async connect(filePath: string): Promise<string> {
    let connection = this.connections.get(filePath);
    if (!connection) {
      const db = new SQLite();
      await db.open(filePath);
      connection = { db, refCount: 0 };
      this.connections.set(filePath, connection);
    }
    connection.refCount++;
    return filePath; // Use filePath as connection ID
  }

  async run(connectionId: string, sql: string, parameters: any[] = []) {
    const connection = this.connections.get(connectionId);
    if (!connection) throw new Error(`Connection ${connectionId} not found`);
    const result = await connection.db.run(sql, parameters);
    if (this.isWriteOperation(sql)) {
      this.emit("change", { connectionId });
    }
    return result;
  }

  async exec(connectionId: string, sql: string, parameters: any[] = []) {
    const connection = this.connections.get(connectionId);
    if (!connection) throw new Error(`Connection ${connectionId} not found`);
    const result = await connection.db.exec(sql, parameters);
    if (this.isWriteOperation(sql)) {
      this.emit("change", { connectionId });
    }
    return result;
  }

  async close(connectionId: string) {
    const connection = this.connections.get(connectionId);
    if (connection) {
      connection.refCount--;
      console.log(
        `Connection closed for ${connectionId}. RefCount: ${connection.refCount}`
      );
      if (connection.refCount <= 0) {
        await connection.db.close();
        this.connections.delete(connectionId);
        console.log(`Database closed for ${connectionId}`);
      }
    }
  }

  private isWriteOperation(sql: string) {
    return /^\s*(insert|update|delete|replace|create|drop|alter)/i.test(sql);
  }
}

export const sqlService = new SqlService();
