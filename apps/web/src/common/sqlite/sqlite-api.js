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

import * as SQLite from "./sqlite-constants.js";
export * from "./sqlite-constants.js";

const MAX_INT64 = 0x7fffffffffffffffn;
const MIN_INT64 = -0x8000000000000000n;

export class SQLiteError extends Error {
  constructor(message, code) {
    super(message);
    this.code = code;
  }
}

const async = true;

/**
 * Builds a Javascript API from the Emscripten module. This API is still
 * low-level and closely corresponds to the C API exported by the module,
 * but differs in some specifics like throwing exceptions on errors.
 * @param {*} Module SQLite Emscripten module
 */
export function Factory(Module) {
  /** @type {SQLiteAPI} */
  const sqlite3 = {};

  const sqliteFreeAddress = Module._getSqliteFree();

  // Allocate some space for 32-bit returned values.
  const tmp = Module._malloc(8);
  const tmpPtr = [tmp, tmp + 4];

  // Convert a JS string to a C string. sqlite3_malloc is used to allocate
  // memory (use sqlite3_free to deallocate).
  function createUTF8(s) {
    if (typeof s !== "string") return 0;
    const n = Module.lengthBytesUTF8(s);
    const zts = Module._sqlite3_malloc(n + 1);
    Module.stringToUTF8(s, zts, n + 1);
    return zts;
  }

  /**
   * Concatenate 32-bit numbers into a 64-bit (signed) BigInt.
   * @param {number} lo32
   * @param {number} hi32
   * @returns {bigint}
   */
  function cvt32x2ToBigInt(lo32, hi32) {
    return (BigInt(hi32) << 32n) | (BigInt(lo32) & 0xffffffffn);
  }

  /**
   * Concatenate 32-bit numbers and return as number or BigInt, depending
   * on the value.
   * @param {number} lo32
   * @param {number} hi32
   * @returns {number|bigint}
   */
  const cvt32x2AsSafe = (function () {
    const hiMax = BigInt(Number.MAX_SAFE_INTEGER) >> 32n;
    const hiMin = BigInt(Number.MIN_SAFE_INTEGER) >> 32n;

    return function (lo32, hi32) {
      if (hi32 > hiMax || hi32 < hiMin) {
        // Can't be expressed as a Number so use BigInt.
        return cvt32x2ToBigInt(lo32, hi32);
      } else {
        // Combine the upper and lower 32-bit numbers. The complication is
        // that lo32 is a signed integer which makes manipulating its bits
        // a little tricky - the sign bit gets handled separately.
        return hi32 * 0x100000000 + (lo32 & 0x7fffffff) - (lo32 & 0x80000000);
      }
    };
  })();

  const databases = new Set();
  function verifyDatabase(db) {
    if (!databases.has(db)) {
      throw new SQLiteError("not a database", SQLite.SQLITE_MISUSE);
    }
  }

  const mapStmtToDB = new Map();
  function verifyStatement(stmt) {
    if (!mapStmtToDB.has(stmt)) {
      throw new SQLiteError("not a statement", SQLite.SQLITE_MISUSE);
    }
  }

  sqlite3.bind_collection = function (stmt, bindings) {
    verifyStatement(stmt);
    const isArray = Array.isArray(bindings);
    const nBindings = sqlite3.bind_parameter_count(stmt);
    for (let i = 1; i <= nBindings; ++i) {
      const key = isArray ? i - 1 : sqlite3.bind_parameter_name(stmt, i);
      const value = bindings[key];
      if (value !== undefined) {
        sqlite3.bind(stmt, i, value);
      }
    }
    return SQLite.SQLITE_OK;
  };

  sqlite3.bind = function (stmt, i, value) {
    // verifyStatement(stmt);
    switch (typeof value) {
      case "number":
        if (value === (value | 0)) {
          return sqlite3.bind_int(stmt, i, value);
        } else {
          return sqlite3.bind_double(stmt, i, value);
        }
      case "string":
        return sqlite3.bind_text(stmt, i, value);
      default:
        if (value instanceof Uint8Array || Array.isArray(value)) {
          return sqlite3.bind_blob(stmt, i, value);
        } else if (value === null) {
          return sqlite3.bind_null(stmt, i);
        } else if (typeof value === "bigint") {
          return sqlite3.bind_int64(stmt, i, value);
        } else if (value === undefined) {
          // Existing binding (or NULL) will be used.
          return SQLite.SQLITE_NOTICE;
        } else {
          console.warn("unknown binding converted to null", value);
          return sqlite3.bind_null(stmt, i);
        }
    }
  };

  sqlite3.bind_blob = (function () {
    const fname = "sqlite3_bind_blob";
    const f = Module.cwrap(fname, ...decl("nnnnn:n"));
    return function (stmt, i, value) {
      //  verifyStatement(stmt);
      // @ts-ignore
      const byteLength = value.byteLength ?? value.length;
      const ptr = Module._sqlite3_malloc(byteLength);
      Module.HEAPU8.subarray(ptr).set(value);
      const result = f(stmt, i, ptr, byteLength, sqliteFreeAddress);
      // trace(fname, result);
      return check(fname, result, null, stmt);
    };
  })();

  sqlite3.bind_parameter_count = (function () {
    const fname = "sqlite3_bind_parameter_count";
    const f = Module.cwrap(fname, ...decl("n:n"));
    return function (stmt) {
      // verifyStatement(stmt);
      const result = f(stmt);
      // trace(fname, result);
      return result;
    };
  })();

  sqlite3.clear_bindings = (function () {
    const fname = "sqlite3_clear_bindings";
    const f = Module.cwrap(fname, ...decl("n:n"));
    return function (stmt) {
      // verifyStatement(stmt);
      const result = f(stmt);
      // trace(fname, result);
      return result;
    };
  })();

  sqlite3.bind_double = (function () {
    const fname = "sqlite3_bind_double";
    const f = Module.cwrap(fname, ...decl("nnn:n"));
    return function (stmt, i, value) {
      // verifyStatement(stmt);
      const result = f(stmt, i, value);
      // trace(fname, result);
      return check(fname, result, null, stmt);
    };
  })();

  sqlite3.bind_int = (function () {
    const fname = "sqlite3_bind_int";
    const f = Module.cwrap(fname, ...decl("nnn:n"));
    return function (stmt, i, value) {
      // verifyStatement(stmt);
      if (value > 0x7fffffff || value < -0x80000000) return SQLite.SQLITE_RANGE;

      const result = f(stmt, i, value);
      // trace(fname, result);
      return check(fname, result, null, stmt);
    };
  })();

  sqlite3.bind_int64 = (function () {
    const fname = "sqlite3_bind_int64";
    const f = Module.cwrap(fname, ...decl("nnnn:n"));
    return function (stmt, i, value) {
      // verifyStatement(stmt);
      if (value > MAX_INT64 || value < MIN_INT64) return SQLite.SQLITE_RANGE;

      const lo32 = value & 0xffffffffn;
      const hi32 = value >> 32n;
      const result = f(stmt, i, Number(lo32), Number(hi32));
      // trace(fname, result);
      return check(fname, result, null, stmt);
    };
  })();

  sqlite3.bind_null = (function () {
    const fname = "sqlite3_bind_null";
    const f = Module.cwrap(fname, ...decl("nn:n"));
    return function (stmt, i) {
      // verifyStatement(stmt);
      const result = f(stmt, i);
      // trace(fname, result);
      return check(fname, result, null, stmt);
    };
  })();

  sqlite3.bind_parameter_name = (function () {
    const fname = "sqlite3_bind_parameter_name";
    const f = Module.cwrap(fname, ...decl("n:s"));
    return function (stmt, i) {
      // verifyStatement(stmt);
      const result = f(stmt, i);
      // trace(fname, result);
      return result;
    };
  })();

  sqlite3.bind_text = (function () {
    const fname = "sqlite3_bind_text";
    const f = Module.cwrap(fname, ...decl("nnnnn:n"));
    return function (stmt, i, value) {
      // verifyStatement(stmt);
      const ptr = createUTF8(value);
      const result = f(stmt, i, ptr, -1, sqliteFreeAddress);
      // trace(fname, result);
      return check(fname, result, null, stmt);
    };
  })();

  sqlite3.changes = (function () {
    const fname = "sqlite3_changes";
    const f = Module.cwrap(fname, ...decl("n:n"));
    return function (db) {
      verifyDatabase(db);
      const result = f(db);
      // trace(fname, result);
      return result;
    };
  })();

  sqlite3.close = (function () {
    const fname = "sqlite3_close";
    const f = Module.cwrap(fname, ...decl("n:n"), { async });
    return async function (db) {
      verifyDatabase(db);
      const result = await f(db);
      databases.delete(db);
      return check(fname, result, db);
    };
  })();

  sqlite3.column = function (stmt, iCol) {
    verifyStatement(stmt);
    const type = sqlite3.column_type(stmt, iCol);
    switch (type) {
      case SQLite.SQLITE_BLOB:
        return sqlite3.column_blob(stmt, iCol);
      case SQLite.SQLITE_FLOAT:
        return sqlite3.column_double(stmt, iCol);
      case SQLite.SQLITE_INTEGER: {
        const lo32 = sqlite3.column_int(stmt, iCol);
        const hi32 = Module.getTempRet0();
        return cvt32x2AsSafe(lo32, hi32);
      }
      case SQLite.SQLITE_NULL:
        return null;
      case SQLite.SQLITE_TEXT:
        return sqlite3.column_text(stmt, iCol);
      default:
        throw new SQLiteError("unknown type", type);
    }
  };

  sqlite3.column_blob = (function () {
    const fname = "sqlite3_column_blob";
    const f = Module.cwrap(fname, ...decl("nn:n"));
    return function (stmt, iCol) {
      verifyStatement(stmt);
      const nBytes = sqlite3.column_bytes(stmt, iCol);
      const address = f(stmt, iCol);
      const result = Module.HEAPU8.subarray(address, address + nBytes);
      // trace(fname, result);
      return result;
    };
  })();

  sqlite3.column_bytes = (function () {
    const fname = "sqlite3_column_bytes";
    const f = Module.cwrap(fname, ...decl("nn:n"));
    return function (stmt, iCol) {
      verifyStatement(stmt);
      const result = f(stmt, iCol);
      // trace(fname, result);
      return result;
    };
  })();

  sqlite3.column_count = (function () {
    const fname = "sqlite3_column_count";
    const f = Module.cwrap(fname, ...decl("n:n"));
    return function (stmt) {
      verifyStatement(stmt);
      const result = f(stmt);
      // trace(fname, result);
      return result;
    };
  })();

  sqlite3.column_double = (function () {
    const fname = "sqlite3_column_double";
    const f = Module.cwrap(fname, ...decl("nn:n"));
    return function (stmt, iCol) {
      verifyStatement(stmt);
      const result = f(stmt, iCol);
      // trace(fname, result);
      return result;
    };
  })();

  sqlite3.column_int = (function () {
    // Retrieve int64 but use only the lower 32 bits. The upper 32-bits are
    // accessible with Module.getTempRet0().
    const fname = "sqlite3_column_int64";
    const f = Module.cwrap(fname, ...decl("nn:n"));
    return function (stmt, iCol) {
      verifyStatement(stmt);
      const result = f(stmt, iCol);
      // trace(fname, result);
      return result;
    };
  })();

  sqlite3.column_int64 = (function () {
    const fname = "sqlite3_column_int64";
    const f = Module.cwrap(fname, ...decl("nn:n"));
    return function (stmt, iCol) {
      verifyStatement(stmt);
      const lo32 = f(stmt, iCol);
      const hi32 = Module.getTempRet0();
      const result = cvt32x2ToBigInt(lo32, hi32);
      // trace(fname, result);
      return result;
    };
  })();

  sqlite3.column_name = (function () {
    const fname = "sqlite3_column_name";
    const f = Module.cwrap(fname, ...decl("nn:s"));
    return function (stmt, iCol) {
      verifyStatement(stmt);
      const result = f(stmt, iCol);
      // trace(fname, result);
      return result;
    };
  })();

  sqlite3.column_names = function (stmt) {
    const columns = [];
    const nColumns = sqlite3.column_count(stmt);
    for (let i = 0; i < nColumns; ++i) {
      columns.push(sqlite3.column_name(stmt, i));
    }
    return columns;
  };

  sqlite3.column_text = (function () {
    const fname = "sqlite3_column_text";
    const f = Module.cwrap(fname, ...decl("nn:s"));
    return function (stmt, iCol) {
      verifyStatement(stmt);
      const result = f(stmt, iCol);
      // trace(fname, result);
      return result;
    };
  })();

  sqlite3.column_type = (function () {
    const fname = "sqlite3_column_type";
    const f = Module.cwrap(fname, ...decl("nn:n"));
    return function (stmt, iCol) {
      verifyStatement(stmt);
      const result = f(stmt, iCol);
      // trace(fname, result);
      return result;
    };
  })();

  sqlite3.create_function = function (
    db,
    zFunctionName,
    nArg,
    eTextRep,
    pApp,
    xFunc,
    xStep,
    xFinal
  ) {
    verifyDatabase(db);
    if (xFunc && !xStep && !xFinal) {
      const result = Module.createFunction(
        db,
        zFunctionName,
        nArg,
        eTextRep,
        pApp,
        xFunc
      );
      return check("sqlite3_create_function", result, db);
    }

    if (!xFunc && xStep && xFinal) {
      const result = Module.createAggregate(
        db,
        zFunctionName,
        nArg,
        eTextRep,
        pApp,
        xStep,
        xFinal
      );
      return check("sqlite3_create_function", result, db);
    }

    throw new SQLiteError("invalid function combination", SQLite.SQLITE_MISUSE);
  };

  sqlite3.create_module = function (db, zName, module, appData) {
    verifyDatabase(db);
    const result = Module.createModule(db, zName, module, appData);
    return check("sqlite3_create_module", result, db);
  };

  sqlite3.data_count = (function () {
    const fname = "sqlite3_data_count";
    const f = Module.cwrap(fname, ...decl("n:n"));
    return function (stmt) {
      verifyStatement(stmt);
      const result = f(stmt);
      // trace(fname, result);
      return result;
    };
  })();

  sqlite3.declare_vtab = (function () {
    const fname = "sqlite3_declare_vtab";
    const f = Module.cwrap(fname, ...decl("ns:n"));
    return function (pVTab, zSQL) {
      const result = f(pVTab, zSQL);
      return check("sqlite3_declare_vtab", result);
    };
  })();

  sqlite3.exec = async function (db, sql, callback) {
    for await (const stmt of sqlite3.statements(db, sql)) {
      let columns;
      while ((await sqlite3.step(stmt)) === SQLite.SQLITE_ROW) {
        if (callback) {
          columns = columns ?? sqlite3.column_names(stmt);
          const row = sqlite3.row(stmt);
          await callback(row, columns);
        }
      }
    }
    return SQLite.SQLITE_OK;
  };

  sqlite3.finalize = (function () {
    const fname = "sqlite3_finalize";
    const f = Module.cwrap(fname, ...decl("n:n"), { async });
    return async function (stmt) {
      if (!mapStmtToDB.has(stmt)) {
        return SQLite.SQLITE_MISUSE;
      }
      const result = await f(stmt);

      // const db = mapStmtToDB.get(stmt);
      mapStmtToDB.delete(stmt);

      // Don't throw on error here. Typically the error has already been
      // thrown and finalize() is part of the cleanup.
      return result;
    };
  })();

  sqlite3.get_autocommit = (function () {
    const fname = "sqlite3_get_autocommit";
    const f = Module.cwrap(fname, ...decl("n:n"));
    return function (db) {
      const result = f(db);
      return result;
    };
  })();

  sqlite3.libversion = (function () {
    const fname = "sqlite3_libversion";
    const f = Module.cwrap(fname, ...decl(":s"));
    return function () {
      const result = f();
      return result;
    };
  })();

  sqlite3.libversion_number = (function () {
    const fname = "sqlite3_libversion_number";
    const f = Module.cwrap(fname, ...decl(":n"));
    return function () {
      const result = f();
      return result;
    };
  })();

  sqlite3.limit = (function () {
    const fname = "sqlite3_limit";
    const f = Module.cwrap(fname, ...decl("nnn:n"));
    return function (db, id, newVal) {
      const result = f(db, id, newVal);
      return result;
    };
  })();

  sqlite3.open_v2 = (function () {
    const fname = "sqlite3_open_v2";
    const f = Module.cwrap(fname, ...decl("snnn:n"), { async });
    return async function (zFilename, flags, zVfs) {
      flags = flags || SQLite.SQLITE_OPEN_CREATE | SQLite.SQLITE_OPEN_READWRITE;
      zVfs = createUTF8(zVfs);
      const result = await f(zFilename, tmpPtr[0], flags, zVfs);

      const db = Module.getValue(tmpPtr[0], "*");
      databases.add(db);
      Module._sqlite3_free(zVfs);

      Module.ccall("RegisterExtensionFunctions", "void", ["number"], [db]);
      Module.ccall("sqlite3Fts5BetterTrigramInit", "void", ["number"], [db]);
      check(fname, result);
      return db;
    };
  })();

  sqlite3.prepare_v2 = (function () {
    const fname = "sqlite3_prepare_v2";
    const f = Module.cwrap(fname, ...decl("nnnnn:n"), { async });
    return async function (db, sql) {
      const result = await f(db, sql, -1, tmpPtr[0], tmpPtr[1]);
      check(fname, result, db);

      const stmt = Module.getValue(tmpPtr[0], "*");
      if (stmt) {
        mapStmtToDB.set(stmt, db);
        return { stmt, sql: Module.getValue(tmpPtr[1], "*") };
      }
      return null;
    };
  })();

  sqlite3.progress_handler = function (db, nProgressOps, handler, userData) {
    verifyDatabase(db);
    Module.progressHandler(db, nProgressOps, handler, userData);
  };

  sqlite3.reset = (function () {
    const fname = "sqlite3_reset";
    const f = Module.cwrap(fname, ...decl("n:n"), { async });
    return async function (stmt) {
      verifyStatement(stmt);
      const result = await f(stmt);
      return check(fname, result, null, stmt);
    };
  })();

  sqlite3.result = function (context, value) {
    switch (typeof value) {
      case "number":
        if (value === (value | 0)) {
          sqlite3.result_int(context, value);
        } else {
          sqlite3.result_double(context, value);
        }
        break;
      case "string":
        sqlite3.result_text(context, value);
        break;
      default:
        if (value instanceof Uint8Array || Array.isArray(value)) {
          sqlite3.result_blob(context, value);
        } else if (value === null) {
          sqlite3.result_null(context);
        } else if (typeof value === "bigint") {
          return sqlite3.result_int64(context, value);
        } else {
          console.warn("unknown result converted to null", value);
          sqlite3.result_null(context);
        }
        break;
    }
  };

  sqlite3.result_blob = (function () {
    const fname = "sqlite3_result_blob";
    const f = Module.cwrap(fname, ...decl("nnnn:n"));
    return function (context, value) {
      // @ts-ignore
      const byteLength = value.byteLength ?? value.length;
      const ptr = Module._sqlite3_malloc(byteLength);
      Module.HEAPU8.subarray(ptr).set(value);
      f(context, ptr, byteLength, sqliteFreeAddress); // void return
    };
  })();

  sqlite3.result_double = (function () {
    const fname = "sqlite3_result_double";
    const f = Module.cwrap(fname, ...decl("nn:n"));
    return function (context, value) {
      f(context, value); // void return
    };
  })();

  sqlite3.result_int = (function () {
    const fname = "sqlite3_result_int";
    const f = Module.cwrap(fname, ...decl("nn:n"));
    return function (context, value) {
      f(context, value); // void return
    };
  })();

  sqlite3.result_int64 = (function () {
    const fname = "sqlite3_result_int64";
    const f = Module.cwrap(fname, ...decl("nnn:n"));
    return function (context, value) {
      if (value > MAX_INT64 || value < MIN_INT64) return SQLite.SQLITE_RANGE;

      const lo32 = value & 0xffffffffn;
      const hi32 = value >> 32n;
      f(context, Number(lo32), Number(hi32)); // void return
    };
  })();

  sqlite3.result_null = (function () {
    const fname = "sqlite3_result_null";
    const f = Module.cwrap(fname, ...decl("n:n"));
    return function (context) {
      f(context); // void return
    };
  })();

  sqlite3.result_text = (function () {
    const fname = "sqlite3_result_text";
    const f = Module.cwrap(fname, ...decl("nnnn:n"));
    return function (context, value) {
      const ptr = createUTF8(value);
      f(context, ptr, -1, sqliteFreeAddress); // void return
    };
  })();

  sqlite3.row = function (stmt) {
    const row = [];
    const nColumns = sqlite3.data_count(stmt);
    for (let i = 0; i < nColumns; ++i) {
      const value = sqlite3.column(stmt, i);

      // Copy blob if aliasing volatile WebAssembly memory. This avoids an
      // unnecessary copy if users monkey patch column_blob to copy.
      // @ts-ignore
      row.push(value?.buffer === Module.HEAPU8.buffer ? value.slice() : value);
    }
    return row;
  };

  sqlite3.set_authorizer = function (db, authFunction, userData) {
    verifyDatabase(db);
    const result = Module.setAuthorizer(db, authFunction, userData);
    return check("sqlite3_set_authorizer", result, db);
  };

  sqlite3.sql = (function () {
    const fname = "sqlite3_sql";
    const f = Module.cwrap(fname, ...decl("n:s"));
    return function (stmt) {
      verifyStatement(stmt);
      const result = f(stmt);
      // trace(fname, result);
      return result;
    };
  })();

  sqlite3.statements = function (db, sql) {
    return (async function* () {
      const str = sqlite3.str_new(db, sql);
      let prepared = { stmt: null, sql: sqlite3.str_value(str) };
      try {
        while ((prepared = await sqlite3.prepare_v2(db, prepared.sql))) {
          // console.log(sqlite3.sql(prepared.stmt));
          yield prepared.stmt;
          sqlite3.finalize(prepared.stmt);
          prepared.stmt = null;
        }
      } finally {
        if (prepared?.stmt) {
          sqlite3.finalize(prepared.stmt);
        }
        sqlite3.str_finish(str);
      }
    })();
  };

  sqlite3.step = (function () {
    const fname = "sqlite3_step";
    const f = Module.cwrap(fname, ...decl("n:n"), { async });
    return async function (stmt) {
      // verifyStatement(stmt);
      const result = await f(stmt);
      return check(fname, result, null, stmt, [
        SQLite.SQLITE_ROW,
        SQLite.SQLITE_DONE
      ]);
    };
  })();

  sqlite3.last_insert_rowid = (function () {
    const fname = "sqlite3_last_insert_rowid";
    const f = Module.cwrap(fname, ...decl("n:n"));
    return function (db) {
      verifyDatabase(db);
      const result = f(db);
      return result;
    };
  })();

  // Duplicate some of the SQLite dynamic string API but without
  // calling SQLite (except for memory allocation). We need some way
  // to transfer Javascript strings and might as well use an API
  // that mimics the SQLite API.
  let stringId = 0;
  const strings = new Map();

  sqlite3.str_new = function (db, s = "") {
    const sBytes = Module.lengthBytesUTF8(s);
    const str = stringId++ & 0xffffffff;
    const data = {
      offset: Module._sqlite3_malloc(sBytes + 1),
      bytes: sBytes
    };
    strings.set(str, data);
    Module.stringToUTF8(s, data.offset, data.bytes + 1);
    return str;
  };

  sqlite3.str_appendall = function (str, s) {
    if (!strings.has(str)) {
      throw new SQLiteError("not a string", SQLite.SQLITE_MISUSE);
    }
    const data = strings.get(str);

    const sBytes = Module.lengthBytesUTF8(s);
    const newBytes = data.bytes + sBytes;
    const newOffset = Module._sqlite3_malloc(newBytes + 1);
    const newArray = Module.HEAPU8.subarray(
      newOffset,
      newOffset + newBytes + 1
    );
    newArray.set(Module.HEAPU8.subarray(data.offset, data.offset + data.bytes));
    Module.stringToUTF8(s, newOffset + data.bytes, sBytes + 1);

    Module._sqlite3_free(data.offset);
    data.offset = newOffset;
    data.bytes = newBytes;
    strings.set(str, data);
  };

  sqlite3.str_finish = function (str) {
    if (!strings.has(str)) {
      throw new SQLiteError("not a string", SQLite.SQLITE_MISUSE);
    }
    const data = strings.get(str);
    strings.delete(str);
    Module._sqlite3_free(data.offset);
  };

  sqlite3.str_value = function (str) {
    if (!strings.has(str)) {
      throw new SQLiteError("not a string", SQLite.SQLITE_MISUSE);
    }
    return strings.get(str).offset;
  };

  sqlite3.user_data = function (context) {
    return Module.getFunctionUserData(context);
  };

  sqlite3.value = function (pValue) {
    const type = sqlite3.value_type(pValue);
    switch (type) {
      case SQLite.SQLITE_BLOB:
        return sqlite3.value_blob(pValue);
      case SQLite.SQLITE_FLOAT:
        return sqlite3.value_double(pValue);
      case SQLite.SQLITE_INTEGER: {
        const lo32 = sqlite3.value_int(pValue);
        const hi32 = Module.getTempRet0();
        return cvt32x2AsSafe(lo32, hi32);
      }
      case SQLite.SQLITE_NULL:
        return null;
      case SQLite.SQLITE_TEXT:
        return sqlite3.value_text(pValue);
      default:
        throw new SQLiteError("unknown type", type);
    }
  };

  sqlite3.value_blob = (function () {
    const fname = "sqlite3_value_blob";
    const f = Module.cwrap(fname, ...decl("n:n"));
    return function (pValue) {
      const nBytes = sqlite3.value_bytes(pValue);
      const address = f(pValue);
      const result = Module.HEAPU8.subarray(address, address + nBytes);
      // trace(fname, result);
      return result;
    };
  })();

  sqlite3.value_bytes = (function () {
    const fname = "sqlite3_value_bytes";
    const f = Module.cwrap(fname, ...decl("n:n"));
    return function (pValue) {
      const result = f(pValue);
      // trace(fname, result);
      return result;
    };
  })();

  sqlite3.value_double = (function () {
    const fname = "sqlite3_value_double";
    const f = Module.cwrap(fname, ...decl("n:n"));
    return function (pValue) {
      const result = f(pValue);
      // trace(fname, result);
      return result;
    };
  })();

  sqlite3.value_int = (function () {
    const fname = "sqlite3_value_int64";
    const f = Module.cwrap(fname, ...decl("n:n"));
    return function (pValue) {
      const result = f(pValue);
      // trace(fname, result);
      return result;
    };
  })();

  sqlite3.value_int64 = (function () {
    const fname = "sqlite3_value_int64";
    const f = Module.cwrap(fname, ...decl("n:n"));
    return function (pValue) {
      const lo32 = f(pValue);
      const hi32 = Module.getTempRet0();
      const result = cvt32x2ToBigInt(lo32, hi32);
      // trace(fname, result);
      return result;
    };
  })();

  sqlite3.value_text = (function () {
    const fname = "sqlite3_value_text";
    const f = Module.cwrap(fname, ...decl("n:s"));
    return function (pValue) {
      const result = f(pValue);
      // trace(fname, result);
      return result;
    };
  })();

  sqlite3.value_type = (function () {
    const fname = "sqlite3_value_type";
    const f = Module.cwrap(fname, ...decl("n:n"));
    return function (pValue) {
      const result = f(pValue);
      // trace(fname, result);
      return result;
    };
  })();

  sqlite3.vfs_register = function (vfs, makeDefault) {
    const result = Module.registerVFS(vfs, makeDefault);
    return check("sqlite3_vfs_register", result);
  };

  function check(
    fname,
    result,
    db = null,
    stmt = null,
    allowed = [SQLite.SQLITE_OK]
  ) {
    // trace(fname, result);
    if (allowed.includes(result)) return result;
    db = db || (stmt !== null ? mapStmtToDB.get(stmt) : null);
    const message = db
      ? Module.ccall("sqlite3_errmsg", "string", ["number"], [db])
      : fname;
    throw new SQLiteError(message, result);
  }

  return sqlite3;
}

function trace(...args) {
  // const date = new Date();
  // const t = date.getHours().toString().padStart(2, '0') + ':' +
  //           date.getMinutes().toString().padStart(2, '0') + ':' +
  //           date.getSeconds().toString().padStart(2, '0') + '.' +
  //           date.getMilliseconds().toString().padStart(3, '0');
  // console.debug(t, ...args);
}

// Helper function to use a more compact signature specification.
function decl(s) {
  const result = [];
  const m = s.match(/([ns@]*):([nsv@])/);
  switch (m[2]) {
    case "n":
      result.push("number");
      break;
    case "s":
      result.push("string");
      break;
    case "v":
      result.push(null);
      break;
  }

  const args = [];
  for (let c of m[1]) {
    switch (c) {
      case "n":
        args.push("number");
        break;
      case "s":
        args.push("string");
        break;
    }
  }
  result.push(args);
  return result;
}
