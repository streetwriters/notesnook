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

/**
 * This is a WebAssembly build of SQLite with experimental support for
 * writing SQLite virtual file systems and modules (for virtual tables)
 * in Javascript. Also see the
 * [GitHub repository](https://github.com/rhashimoto/wa-sqlite) and the
 * [online demo](https://rhashimoto.github.io/wa-sqlite/demo/).
 * @module
 */

/**
 *  Javascript types that SQLite can use
 *
 * C integer and floating-point types both map to/from Javascript `number`.
 * Blob data can be provided to SQLite as `Uint8Array` or `number[]` (with
 * each element converted to a byte); SQLite always returns blob data as
 * `Uint8Array`
 */
export type SQLiteCompatibleType =
  | number
  | string
  | Uint8Array
  | Array<number>
  | bigint
  | null;

/**
 * SQLite Virtual File System object
 *
 * Objects with this interface can be passed to {@link SQLiteAPI.vfs_register}
 * to define a new filesystem.
 *
 * There are examples of a synchronous
 * [MemoryVFS.js](https://github.com/rhashimoto/wa-sqlite/blob/master/src/examples/MemoryVFS.js),
 * and asynchronous
 * [MemoryAsyncVFS.js](https://github.com/rhashimoto/wa-sqlite/blob/master/src/examples/MemoryAsyncVFS.js)
 * and
 * [IndexedDbVFS.js](https://github.com/rhashimoto/wa-sqlite/blob/master/src/examples/IndexedDbVFS.js).
 *
 * @see https://sqlite.org/vfs.html
 * @see https://sqlite.org/c3ref/io_methods.html
 */
export interface SQLiteVFS {
  /** Maximum length of a file path in UTF-8 bytes (default 64) */
  mxPathName?: number;

  /** @see https://sqlite.org/c3ref/io_methods.html */
  xClose(fileId: number): number;

  /** @see https://sqlite.org/c3ref/io_methods.html */
  xRead(fileId: number, pData: Uint8Array, iOffset: number): number;

  /** @see https://sqlite.org/c3ref/io_methods.html */
  xWrite(fileId: number, pData: Uint8Array, iOffset: number): number;

  /** @see https://sqlite.org/c3ref/io_methods.html */
  xTruncate(fileId: number, iSize: number): number;

  /** @see https://sqlite.org/c3ref/io_methods.html */
  xSync(fileId: number, flags: number): number;

  /** @see https://sqlite.org/c3ref/io_methods.html */
  xFileSize(fileId: number, pSize64: DataView): number;

  /** @see https://sqlite.org/c3ref/io_methods.html */
  xLock(fileId: number, flags: number): number;

  /** @see https://sqlite.org/c3ref/io_methods.html */
  xUnlock(fileId: number, flags: number): number;

  /** @see https://sqlite.org/c3ref/io_methods.html */
  xCheckReservedLock(fileId: number, pResOut: DataView): number;

  /** @see https://sqlite.org/c3ref/io_methods.html */
  xFileControl(fileId: number, flags: number, pOut: DataView): number;

  /** @see https://sqlite.org/c3ref/io_methods.html */
  xDeviceCharacteristics(fileId: number): number;

  /** @see https://sqlite.org/c3ref/vfs.html */
  xOpen(
    name: string | null,
    fileId: number,
    flags: number,
    pOutFlags: DataView
  ): number;

  /** @see https://sqlite.org/c3ref/vfs.html */
  xDelete(name: string, syncDir: number): number;

  /** @see https://sqlite.org/c3ref/vfs.html */
  xAccess(name: string, flags: number, pResOut: DataView): number;
}

/**
 * This object is passed by SQLite to implementations of
 * {@link SQLiteModule.xBestIndex}
 * @see https://sqlite.org/c3ref/index_info.html
 */
export interface SQLiteModuleIndexInfo {
  nConstraint: number;
  aConstraint: Array<{
    iColumn: number;
    op: number;
    usable: boolean;
  }>;
  nOrderBy: number;
  aOrderBy: Array<{
    iColumn: number;
    desc: boolean;
  }>;
  aConstraintUsage: Array<{
    argvIndex: number;
    omit: boolean;
  }>;
  idxNum: number;
  idxStr: string | null;
  orderByConsumed: boolean;
  estimatedCost: number;
  estimatedRows: number;
  idxFlags: number;
  colUsed: number;
}

/**
 * SQLite Module object
 *
 * Objects with this interface can be passed to {@link SQLiteAPI.create_module}
 * to define a module for virtual tables.
 *
 * There is an example
 * [ArrayModule.js](https://github.com/rhashimoto/wa-sqlite/blob/master/src/examples/ArrayModule.js)
 * that allows a virtual table to reference a Javascript array.
 *
 * @see https://sqlite.org/vtab.html
 */
export interface SQLiteModule {
  /**
   * @see https://sqlite.org/vtab.html#the_xcreate_method
   */
  xCreate?(
    db: number,
    appData: any,
    argv: string[],
    pVTab: number,
    pzErr: DataView
  ): number;

  /**
   * @see https://sqlite.org/vtab.html#the_xconnect_method
   */
  xConnect(
    db: number,
    appData: any,
    argv: string[],
    pVTab: number,
    pzErr: DataView
  ): number;

  /**
   * @see https://sqlite.org/vtab.html#the_xbestindex_method
   */
  xBestIndex(pVTab: number, indexInfo: SQLiteModuleIndexInfo): number;

  /**
   * @see https://sqlite.org/vtab.html#the_xdisconnect_method
   */
  xDisconnect(pVTab: number): number;

  /**
   * @see https://sqlite.org/vtab.html#the_xdestroy_method
   */
  xDestroy(pVTab: number): number;

  /**
   * @see https://sqlite.org/vtab.html#the_xopen_method
   */
  xOpen(pVTab: number, pCursor: number): number;

  /**
   * @see https://sqlite.org/vtab.html#the_xclose_method
   */
  xClose(pCursor: number): number;

  /**
   * @see https://sqlite.org/vtab.html#the_xfilter_method
   */
  xFilter(
    pCursor: number,
    idxNum: number,
    idxString: string | null,
    values: number[]
  ): number;

  /**
   * @see https://sqlite.org/vtab.html#the_xnext_method
   */
  xNext(pCursor: number): number;

  /**
   * @see https://sqlite.org/vtab.html#the_xeof_method
   */
  xEof(pCursor: number): number;

  /**
   * @see https://sqlite.org/vtab.html#the_xcolumn_method
   */
  xColumn(pCursor: number, pContext: number, iCol: number): number;

  /**
   * @see https://sqlite.org/vtab.html#the_xrowid_method
   */
  xRowid(pCursor: number, pRowid: DataView): number;

  /**
   * @see https://sqlite.org/vtab.html#the_xupdate_method
   */
  xUpdate?(pVTab: number, values: number[], pRowId: DataView): number;

  /**
   * @see https://sqlite.org/vtab.html#the_xbegin_method
   */
  xBegin?(pVTab: number): number;

  /**
   * @see https://sqlite.org/vtab.html#the_xsync_method
   */
  xSync?(pVTab: number): number;

  /**
   * @see https://sqlite.org/vtab.html#the_xcommit_method
   */
  xCommit?(pVTab: number): number;

  /**
   * @see https://sqlite.org/vtab.html#the_xrollback_method
   */
  xRollback?(pVTab: number): number;

  /**
   * @see https://sqlite.org/vtab.html#the_xrename_method
   */
  xRename?(pVTab: number, zNew: string): number;
}

/**
 * Javascript wrappers for the SQLite C API (plus a few convenience functions)
 *
 * Function signatures have been slightly modified to be more
 * Javascript-friendly. For the C functions that return an error code,
 * the corresponding Javascript wrapper will throw an exception with a
 * `code` property on an error.
 *
 * Note that a few functions return a Promise in order to accommodate
 * either a synchronous or asynchronous SQLite build, generally those
 * involved with opening/closing a database or executing a statement.
 *
 * To create an instance of the API, follow these steps:
 *
 * ```javascript
 * // Import an ES6 module factory function from one of the
 * // package builds, either 'wa-sqlite.mjs' (synchronous) or
 * // 'wa-sqlite-async.mjs' (asynchronous). You should only
 * // use the asynchronous build if you plan to use an
 * // asynchronous VFS or module.
 * import SQLiteESMFactory from 'wa-sqlite/dist/wa-sqlite.mjs';
 *
 * // Import the Javascript API wrappers.
 * import * as SQLite from 'wa-sqlite';
 *
 * // Use an async function to simplify Promise handling.
 * (async function() {
 *   // Invoke the ES6 module factory to create the SQLite
 *   // Emscripten module. This will fetch and compile the
 *   // .wasm file.
 *   const module = await SQLiteESMFactory();
 *
 *   // Use the module to build the API instance.
 *   const sqlite3 = SQLite.Factory(module);
 *
 *   // Use the API to open and access a database.
 *   const db = await sqlite3.open_v2('myDB');
 *   ...
 * })();
 * ```
 *
 * @see https://sqlite.org/c3ref/funclist.html
 */
export interface SQLiteAPI {
  /**
   * Bind a collection of values to a statement
   *
   * This convenience function binds values from either an array or object
   * to a prepared statement with placeholder parameters.
   *
   * Array example using numbered parameters (numbering is implicit in
   * this example):
   * ```
   * const str = sqlite3.str_new(db, `
   *   INSERT INTO tbl VALUES (?, ?, ?);
   * `);
   * const prepared = await sqlite3.prepare_v2(db, sqlite3.str_value(str));
   * sqlite3.bind_collection(prepared.stmt, [42, 'hello', null]);
   * ...
   * ```
   *
   * Object example using named parameters (':', '@', or '$' prefixes
   * are allowed):
   * ```
   * const str = sqlite3.str_new(db, `
   *   INSERT INTO tbl VALUES (@foo, @bar, @baz);
   * `);
   * const prepared = await sqlite3.prepare_v2(db, sqlite3.str_value(str));
   * sqlite3.bind_collection(prepared.stmt, {
   *   '@foo': 42,
   *   '@bar': 'hello',
   *   '@baz': null,
   * });
   * ...
   * ```
   *
   * Note that SQLite bindings are indexed beginning with 1, but when
   * binding values from an array `a` the values begin with `a[0]`.
   * @param stmt prepared statement pointer
   * @param bindings
   * @returns `SQLITE_OK` (throws exception on error)
   */
  bind_collection(
    stmt: number,
    bindings:
      | { [index: string]: SQLiteCompatibleType | null }
      | Array<SQLiteCompatibleType | null>
  ): number;

  /**
   * Bind value to prepared statement
   *
   * This convenience function calls the appropriate `bind_*` function
   * based on the type of `value`. Note that binding indices begin with 1.
   * @param stmt prepared statement pointer
   * @param i binding index
   * @param value
   * @returns `SQLITE_OK` (throws exception on error)
   */
  bind(stmt: number, i: number, value: SQLiteCompatibleType | null): number;

  /**
   * Bind blob to prepared statement parameter
   *
   * Note that binding indices begin with 1.
   * @see https://www.sqlite.org/c3ref/bind_blob.html
   * @param stmt prepared statement pointer
   * @param i binding index
   * @param value
   * @returns `SQLITE_OK` (throws exception on error)
   */
  bind_blob(stmt: number, i: number, value: Uint8Array | Array<number>): number;

  /**
   * Bind number to prepared statement parameter
   *
   * Note that binding indices begin with 1.
   * @see https://www.sqlite.org/c3ref/bind_blob.html
   * @param stmt prepared statement pointer
   * @param i binding index
   * @param value
   * @returns `SQLITE_OK` (throws exception on error)
   */
  bind_double(stmt: number, i: number, value: number): number;

  /**
   * Bind number to prepared statement parameter
   *
   * Note that binding indices begin with 1.
   * @see https://www.sqlite.org/c3ref/bind_blob.html
   * @param stmt prepared statement pointer
   * @param i binding index
   * @param value
   * @returns `SQLITE_OK` (throws exception on error)
   */
  bind_int(stmt: number, i: number, value: number): number;

  /**
   * Bind number to prepared statement parameter
   *
   * Note that binding indices begin with 1.
   * @see https://www.sqlite.org/c3ref/bind_blob.html
   * @param stmt prepared statement pointer
   * @param i binding index
   * @param value
   * @returns `SQLITE_OK` (throws exception on error)
   */
  bind_int64(stmt: number, i: number, value: bigint): number;

  /**
   * Bind null to prepared statement
   *
   * Note that binding indices begin with 1.
   * @see https://www.sqlite.org/c3ref/bind_blob.html
   * @param stmt prepared statement pointer
   * @param value
   * @returns `SQLITE_OK` (throws exception on error)
   */
  bind_null(stmt: number, i: number): number;

  /**
   * Get number of bound parameters
   * @see https://www.sqlite.org/c3ref/bind_parameter_count.html
   * @param stmt prepared statement pointer
   * @returns number of statement binding locations
   */
  bind_parameter_count(stmt: number): number;

  /**
   * Reset all bindings on a prepared statement
   * @see https://www.sqlite.org/c3ref/clear_bindings.html
   * @param stmt prepared statement pointer
   * @returns `SQLITE_OK` (throws exception on error)
   */
  clear_bindings(stmt: number): number;

  /**
   * Get name of bound parameter
   *
   * Note that binding indices begin with 1.
   * @see https://www.sqlite.org/c3ref/bind_parameter_name.html
   * @param stmt prepared statement pointer
   * @param i binding index
   * @returns binding name
   */
  bind_parameter_name(stmt: number, i: number): string;

  /**
   * Bind string to prepared statement
   *
   * Note that binding indices begin with 1.
   * @see https://www.sqlite.org/c3ref/bind_blob.html
   * @param stmt prepared statement pointer
   * @param i binding index
   * @param value
   * @returns `SQLITE_OK` (throws exception on error)
   */
  bind_text(stmt: number, i: number, value: string): number;

  /**
   * Get count of rows modified by last insert/update
   * @see https://www.sqlite.org/c3ref/changes.html
   * @param db database pointer
   * @returns number of rows modified
   */
  changes(db: number): number;

  /**
   * Close database connection
   * @see https://www.sqlite.org/c3ref/close.html
   * @param db database pointer
   * @returns `SQLITE_OK` (throws exception on error)
   */
  close(db: number): Promise<number>;

  /**
   * Call the appropriate `column_*` function based on the column type
   *
   * The type is determined by calling {@link column_type}, which may
   * not match the type declared in `CREATE TABLE`. Note that if the column
   * value is a blob then as with `column_blob` the result may be invalid
   * after the next SQLite call; copy if it needs to be retained.
   *
   * Integer values are returned as Number if within the min/max safe
   * integer bounds, otherwise they are returned as BigInt.
   * @param stmt prepared statement pointer
   * @param i column index
   * @returns column value
   */
  column(stmt: number, i: number): SQLiteCompatibleType;

  /**
   * Extract a column value from a row after a prepared statement {@link step}
   *
   * The contents of the returned buffer may be invalid after the
   * next SQLite call. Make a copy of the data (e.g. with `.slice()`)
   * if longer retention is required.
   * @see https://www.sqlite.org/c3ref/column_blob.html
   * @param stmt prepared statement pointer
   * @param i column index
   * @returns column value
   */
  column_blob(stmt: number, i: number): Uint8Array;

  /**
   * Get storage size for column text or blob
   * @see https://www.sqlite.org/c3ref/column_blob.html
   * @param stmt prepared statement pointer
   * @param i column index
   * @returns number of bytes in column text or blob
   */
  column_bytes(stmt: number, i: number): number;

  /**
   * Get number of columns for a prepared statement
   * @see https://www.sqlite.org/c3ref/column_blob.html
   * @param stmt prepared statement pointer
   * @returns number of columns
   */
  column_count(stmt: number): number;

  /**
   * Extract a column value from a row after a prepared statement {@link step}
   * @see https://www.sqlite.org/c3ref/column_blob.html
   * @param stmt prepared statement pointer
   * @param i column index
   * @returns column value
   */
  column_double(stmt: number, i: number): number;

  /**
   * Extract a column value from a row after a prepared statement {@link step}
   * @see https://www.sqlite.org/c3ref/column_blob.html
   * @param stmt prepared statement pointer
   * @param i column index
   * @returns column value
   */
  column_int(stmt: number, i: number): number;

  /**
   * Extract a column value from a row after a prepared statement {@link step}
   * @see https://www.sqlite.org/c3ref/column_blob.html
   * @param stmt prepared statement pointer
   * @param i column index
   * @returns column value
   */
  column_int64(stmt: number, i: number): bigint;

  /**
   * Get a column name for a prepared statement
   * @see https://www.sqlite.org/c3ref/column_blob.html
   * @param stmt prepared statement pointer
   * @param i column index
   * @returns column name
   */
  column_name(stmt: number, i: number): string;

  /**
   * Get names for all columns of a prepared statement
   *
   * This is a convenience function that calls {@link column_count} and
   * {@link column_name}.
   * @param stmt
   * @returns array of column names
   */
  column_names(stmt: number): Array<string>;

  /**
   * Extract a column value from a row after a prepared statement {@link step}
   * @see https://www.sqlite.org/c3ref/column_blob.html
   * @param stmt prepared statement pointer
   * @param i column index
   * @returns column value
   */
  column_text(stmt: number, i: number): string;

  /**
   * Get column type for a prepared statement
   *
   * Note that this type may not match the type declared in `CREATE TABLE`.
   * @see https://www.sqlite.org/c3ref/column_blob.html
   * @param stmt prepared statement pointer
   * @param i column index
   * @returns enumeration value for type
   */
  column_type(stmt: number, i: number): number;

  /**
   * Create or redefine SQL functions
   * @see https://sqlite.org/c3ref/create_function.html
   * @param db database pointer
   * @param zFunctionName
   * @param nArg number of function arguments
   * @param eTextRep text encoding (and other flags)
   * @param pApp application data
   * @param xFunc
   * @param xStep
   * @param xFinal
   * @returns `SQLITE_OK` (throws exception on error)
   */
  create_function(
    db: number,
    zFunctionName: string,
    nArg: number,
    eTextRep: number,
    pApp: number,
    xFunc?: (context: number, values: Uint32Array) => void,
    xStep?: (context: number, values: Uint32Array) => void,
    xFinal?: (context: number) => void
  ): number;

  /**
   * Create a SQLite module for virtual tables
   * @see https://www.sqlite.org/c3ref/create_module.html
   * @param db database pointer
   * @param zName
   * @param module
   * @param appData
   * @returns `SQLITE_OK` (throws exception on error)
   */
  create_module(
    db: number,
    zName: string,
    module: SQLiteModule,
    appData?: any
  ): number;

  /**
   * Get number of columns in current row of a prepared statement
   * @see https://www.sqlite.org/c3ref/data_count.html
   * @param stmt prepared statement pointer
   * @returns number of columns
   */
  data_count(stmt: number): number;

  /**
   * Declare the schema of a virtual table in module
   * {@link SQLiteModule.xCreate} or {@link SQLiteModule.xConnect}
   * methods
   * @see https://www.sqlite.org/c3ref/declare_vtab.html
   * @param db database pointer
   * @param zSQL schema declaration
   * @returns `SQLITE_OK` (throws exception on error)
   */
  declare_vtab(db: number, zSQL: string): number;

  /**
   * One-step query execution interface
   *
   * The implementation of this function uses {@link row}, which makes a
   * copy of blobs and returns BigInt for integers outside the safe integer
   * bounds for Number.
   * @see https://www.sqlite.org/c3ref/exec.html
   * @param db database pointer
   * @param zSQL queries
   * @param callback called for each output row
   * @returns Promise resolving to `SQLITE_OK` (rejects on error)
   */
  exec(
    db: number,
    zSQL: string,
    callback?: (
      row: Array<SQLiteCompatibleType | null>,
      columns: string[]
    ) => void
  ): Promise<number>;

  /**
   * Destroy a prepared statement object compiled with {@link prepare_v2}
   *
   * This function does *not* throw on error.
   * @see https://www.sqlite.org/c3ref/finalize.html
   * @param stmt prepared statement pointer
   * @returns Promise resolving to `SQLITE_OK` or error status
   */
  finalize(stmt: number): Promise<number>;

  /**
   * Test for autocommit mode
   * @see https://sqlite.org/c3ref/get_autocommit.html
   * @param db database pointer
   * @returns Non-zero if autocommit mode is on, zero otherwise
   */
  get_autocommit(db: number): number;

  /**
   * Get SQLite library version
   * @see https://www.sqlite.org/c3ref/libversion.html
   * @returns version string, e.g. '3.35.5'
   */
  libversion(): string;

  /**
   * Get SQLite library version
   * @see https://www.sqlite.org/c3ref/libversion.html
   * @returns version number, e.g. 3035005
   */
  libversion_number(): number;

  /**
   * Set a usage limit on a connection.
   * @see https://www.sqlite.org/c3ref/limit.html
   * @param db database pointer
   * @param id limit category
   * @param newVal
   * @returns previous setting
   */
  limit(db: number, id: number, newVal: number): number;

  /**
   * Opening a new database connection.
   *
   * Note that this function differs from the C API in that it
   * returns the Promise-wrapped database pointer (instead of a
   * result code).
   * @see https://sqlite.org/c3ref/open.html
   * @param zFilename
   * @param iFlags `SQLite.SQLITE_OPEN_CREATE | SQLite.SQLITE_OPEN_READWRITE` (0x6) if omitted
   * @param zVfs VFS name
   * @returns Promise-wrapped database pointer.
   */
  open_v2(zFilename: string, iFlags?: number, zVfs?: string): Promise<number>;

  /**
   * Compile an SQL statement
   *
   * SQL is provided as a pointer in WASM memory, so the utility functions
   * {@link str_new} and {@link str_value} should be used. The returned
   * Promise-wrapped object provides both the prepared statement and a
   * pointer to the still uncompiled SQL that can be used with the next
   * call to this function. A Promise containing `null` is returned
   * when no statement remains.
   *
   * Each prepared statement should be destroyed with {@link finalize}
   * after its usage is complete.
   *
   * Code using {@link prepare_v2} generally looks like this:
   * ```javascript
   * const str = sqlite3.str_new(db, sql);
   * try {
   *   // Traverse and prepare the SQL, statement by statement.
   *   let prepared = { stmt: null, sql: sqlite3.str_value(str) };
   *   while ((prepared = await sqlite3.prepare_v2(db, prepared.sql))) {
   *     try {
   *       // Step through the rows produced by the statement.
   *       while (await sqlite3.step(prepared.stmt) === SQLite.SQLITE_ROW) {
   *         // Do something with the row data...
   *       }
   *     } finally {
   *       sqlite3.finalize(prepared.stmt);
   *     }
   *   }
   * } finally {
   *   sqlite3.str_finish(str);
   * }
   * ```
   *
   * The {@link statements} convenience function can be used to
   * avoid the boilerplate of calling {@link prepare_v2} directly.
   * @see https://www.sqlite.org/c3ref/prepare.html
   * @param db database pointer
   * @param sql SQL pointer
   * @returns Promise-wrapped object containing the prepared statement
   * pointer and next SQL pointer, or a Promise containing `null` when
   * no statement remains
   */
  prepare_v2(
    db: number,
    sql: number
  ): Promise<{ stmt: number; sql: number } | null>;

  /**
   * Specify callback to be invoked between long-running queries
   * @param db database pointer
   * @param nProgressOps target number of database operations between handler invocations
   * @param handler
   * @param userData
   */
  progress_handler(
    db: number,
    nProgressOps: number,
    handler: (userData: any) => number,
    userData: any
  ): any;

  /**
   * Reset a prepared statement object
   * @see https://www.sqlite.org/c3ref/reset.html
   * @param stmt prepared statement pointer
   * @returns Promise-wrapped `SQLITE_OK` (rejects on error)
   */
  reset(stmt: number): Promise<number>;

  /**
   * Convenience function to call `result_*` based of the type of `value`
   * @param context context pointer
   * @param value
   */
  result(
    context: number,
    value: (SQLiteCompatibleType | number[]) | null
  ): void;

  /**
   * Set the result of a function or vtable column
   * @see https://sqlite.org/c3ref/result_blob.html
   * @param context context pointer
   * @param value
   */
  result_blob(context: number, value: Uint8Array | number[]): void;

  /**
   * Set the result of a function or vtable column
   * @see https://sqlite.org/c3ref/result_blob.html
   * @param context context pointer
   * @param value
   */
  result_double(context: number, value: number): void;

  /**
   * Set the result of a function or vtable column
   * @see https://sqlite.org/c3ref/result_blob.html
   * @param context context pointer
   * @param value
   */
  result_int(context: number, value: number): void;

  /**
   * Set the result of a function or vtable column
   * @see https://sqlite.org/c3ref/result_blob.html
   * @param context context pointer
   * @param value
   */
  result_int64(context: number, value: bigint): void;

  /**
   * Set the result of a function or vtable column
   * @see https://sqlite.org/c3ref/result_blob.html
   * @param context context pointer
   */
  result_null(context: number): void;

  /**
   * Set the result of a function or vtable column
   * @see https://sqlite.org/c3ref/result_blob.html
   * @param context context pointer
   * @param value
   */
  result_text(context: number, value: string): void;

  /**
   * Get all column data for a row from a prepared statement step
   *
   * This convenience function will return a copy of any blob, unlike
   * {@link column_blob} which returns a value referencing volatile WASM
   * memory with short validity. Like {@link column}, it will return a
   * BigInt for integers outside the safe integer bounds for Number.
   * @param stmt prepared statement pointer
   * @returns row data
   */
  row(stmt: number): Array<SQLiteCompatibleType | null>;

  /**
   * Register a callback function that is invoked to authorize certain SQL statement actions.
   * @see https://www.sqlite.org/c3ref/set_authorizer.html
   * @param db database pointer
   * @param authFunction
   * @param userData
   */
  set_authorizer(
    db: number,
    authFunction: (
      userData: any,
      iActionCode: number,
      param3: string | null,
      param4: string | null,
      param5: string | null,
      param6: string | null
    ) => number,
    userData: any
  ): number;

  /**
   * Get statement SQL
   * @see https://www.sqlite.org/c3ref/expanded_sql.html
   * @param stmt prepared statement pointer
   * @returns SQL
   */
  sql(stmt: number): string;

  /**
   * SQL statement iterator
   *
   * This is a convenience function that manages statement compilation,
   * replacing boilerplate code associated with calling {@link prepare_v2}
   * directly. It is typically used with a `for await` loop (in an
   * async function), like this:
   * ```javascript
   * // Compile one statement on each iteration of this loop.
   * for await (const stmt of sqlite3.statements(db, sql)) {
   *   // Bind parameters here if using SQLite placeholders.
   *
   *   // Execute the statement with this loop.
   *   while (await sqlite3.step(stmt) === SQLite.SQLITE_ROW) {
   *     // Collect row data here.
   *   }
   *
   *   // Change bindings, reset, and execute again if desired.
   * }
   * ```
   *
   * {@link finalize} should *not* be called on a statement provided
   * by the iterator; the statement resources will be released
   * automatically at the end of each iteration. This also means
   * that the statement is only valid within the scope of the loop -
   * use {@link prepare_v2} directly to compile a statement with an
   * application-specified lifetime.
   *
   * If using the iterator manually, i.e. by calling its `next`
   * method, be sure to call the `return` method if iteration
   * is abandoned before completion (`for await` and other implicit
   * traversals provided by Javascript do this automatically)
   * to ensure that all allocated resources are released.
   * @param db database pointer
   * @param sql
   */
  statements(db: number, sql: string): AsyncIterable<number>;

  /**
   * Evaluate an SQL statement
   * @see https://www.sqlite.org/c3ref/step.html
   * @param stmt prepared statement pointer
   * @returns Promise resolving to `SQLITE_ROW` or `SQLITE_DONE`
   * (rejects on error)
   */
  step(stmt: number): Promise<number>;

  /**
   * @see https://www.sqlite.org/c3ref/last_insert_rowid.html
   * @param db database pointer
   * @returns last rowid
   */
  last_insert_rowid(db: number): number;

  /**
   * Create a new `sqlite3_str` dynamic string instance
   *
   * The purpose for `sqlite3_str` is to transfer a SQL string in
   * Javascript to WebAssembly memory for use with {@link prepare_v2}.
   *
   * An optional initialization argument has been added for convenience
   * which is functionally equivalent to (but slightly more efficient):
   *  ```javascript
   *  const str = sqlite3.str_new(db);
   *  sqlite3.str_appendall(str, s);
   *  ```
   *
   * A `sqlite3_str` instance should always be destroyed with
   * {@link str_finish} after use to avoid a resource leak.
   *
   * @see https://www.sqlite.org/c3ref/str_append.html
   * @param db database pointer
   * @param s optional initialization string
   * @returns `sqlite3_str` pointer
   */
  str_new(db: number, s?: string): number;

  /**
   * Add content to a `sqlite3_str` dynamic string
   *
   * Not recommended for building strings incrementally; prefer using
   * Javascript and {@link str_new} with initialization.
   * @see https://www.sqlite.org/c3ref/str_append.html
   * @param str `sqlite3_str` pointer
   * @param s string to append
   */
  str_appendall(str: number, s: string): void;

  /**
   * Get pointer to `sqlite3_str` dynamic string data
   *
   * The returned pointer points to the UTF-8 encoded string in
   * WebAssembly memory. Use as input with {@link prepare_v2}.
   * @see https://www.sqlite.org/c3ref/str_errcode.html
   * @param str `sqlite3_str` pointer
   * @returns pointer to string data
   */
  str_value(str: number): number;

  /**
   * Finalize a `sqlite3_str` dynamic string created with {@link str_new}
   * @see https://www.sqlite.org/c3ref/str_append.html
   * @param str `sqlite3_str` pointer
   */
  str_finish(str: number): void;

  /**
   * Get application data in custom function implementation
   * @see https://sqlite.org/c3ref/user_data.html
   * @param context context pointer
   * @returns application data
   */
  user_data(context: number): any;

  /**
   * Extract a value from `sqlite3_value`
   *
   * This is a convenience function that calls the appropriate `value_*`
   * function based on its type. Note that if the value is a blob then as
   * with `value_blob` the result may be invalid after the next SQLite call.
   *
   * Integer values are returned as Number if within the min/max safe
   * integer bounds, otherwise they are returned as BigInt.
   * @param pValue `sqlite3_value` pointer
   * @returns value
   */
  value(pValue: number): SQLiteCompatibleType;

  /**
   * Extract a value from `sqlite3_value`
   *
   * The contents of the returned buffer may be invalid after the
   * next SQLite call. Make a copy of the data (e.g. with `.slice()`)
   * if longer retention is required.
   * @see https://sqlite.org/c3ref/value_blob.html
   * @param pValue `sqlite3_value` pointer
   * @returns value
   */
  value_blob(pValue: number): Uint8Array;

  /**
   * Get blob or text size for value
   * @see https://sqlite.org/c3ref/value_blob.html
   * @param pValue `sqlite3_value` pointer
   * @returns size
   */
  value_bytes(pValue: number): number;

  /**
   * Extract a value from `sqlite3_value`
   * @see https://sqlite.org/c3ref/value_blob.html
   * @param pValue `sqlite3_value` pointer
   * @returns value
   */
  value_double(pValue: number): number;

  /**
   * Extract a value from `sqlite3_value`
   * @see https://sqlite.org/c3ref/value_blob.html
   * @param pValue `sqlite3_value` pointer
   * @returns value
   */
  value_int(pValue: number): number;

  /**
   * Extract a value from `sqlite3_value`
   * @see https://sqlite.org/c3ref/value_blob.html
   * @param pValue `sqlite3_value` pointer
   * @returns value
   */
  value_int64(pValue: number): bigint;

  /**
   * Extract a value from `sqlite3_value`
   * @see https://sqlite.org/c3ref/value_blob.html
   * @param pValue `sqlite3_value` pointer
   * @returns value
   */
  value_text(pValue: number): string;

  /**
   * Get type of `sqlite3_value`
   * @see https://sqlite.org/c3ref/value_blob.html
   * @param pValue `sqlite3_value` pointer
   * @returns enumeration value for type
   */
  value_type(pValue: number): number;

  /**
   * Register a new Virtual File System.
   *
   * @see https://www.sqlite.org/c3ref/vfs_find.html
   * @param vfs VFS object
   * @param makeDefault
   * @returns `SQLITE_OK` (throws exception on error)
   */
  vfs_register(vfs: SQLiteVFS, makeDefault?: boolean): number;
}
