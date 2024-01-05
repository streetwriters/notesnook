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

import { Deflate as FflateDeflate, Inflate as FflateInflate } from "fflate";

function initShimAsyncCodec(library, options = {}, registerDataHandler) {
  return {
    Deflate: createCodecClass(
      library.Deflate,
      options.deflate,
      registerDataHandler
    ),
    Inflate: createCodecClass(
      library.Inflate,
      options.inflate,
      registerDataHandler
    )
  };
}

function objectHasOwn(object, propertyName) {
  // eslint-disable-next-line no-prototype-builtins
  return typeof Object.hasOwn === "function"
    ? Object.hasOwn(object, propertyName)
    : // eslint-disable-next-line no-prototype-builtins
      object.hasOwnProperty(propertyName);
}

function createCodecClass(
  constructor,
  constructorOptions,
  registerDataHandler
) {
  return class {
    constructor(options) {
      // eslint-disable-next-line @typescript-eslint/no-this-alias
      const codecAdapter = this;
      const onData = (data) => {
        if (codecAdapter.pendingData) {
          const previousPendingData = codecAdapter.pendingData;
          codecAdapter.pendingData = new Uint8Array(
            previousPendingData.length + data.length
          );
          const { pendingData } = codecAdapter;
          pendingData.set(previousPendingData, 0);
          pendingData.set(data, previousPendingData.length);
        } else {
          codecAdapter.pendingData = new Uint8Array(data);
        }
      };
      if (objectHasOwn(options, "level") && options.level === undefined) {
        delete options.level;
      }
      codecAdapter.codec = new constructor(
        Object.assign({}, constructorOptions, options)
      );
      registerDataHandler(codecAdapter.codec, onData);
    }
    append(data) {
      this.codec.push(data);
      return getResponse(this);
    }
    flush() {
      this.codec.push(new Uint8Array(), true);
      return getResponse(this);
    }
  };

  function getResponse(codec) {
    if (codec.pendingData) {
      const output = codec.pendingData;
      codec.pendingData = null;
      return output;
    } else {
      return new Uint8Array();
    }
  }
}

const { Deflate, Inflate } = initShimAsyncCodec(
  { Deflate: FflateDeflate, Inflate: FflateInflate },
  undefined,
  (codec, onData) => (codec.ondata = onData)
);
export { Deflate, Inflate };
