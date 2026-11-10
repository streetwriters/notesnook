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
import { useCallback, useEffect, useRef, useState } from "react";
import {
  CompressedImage,
  compressImage,
  getCompressionType,
  unlinkFile
} from "../common/filesystem/compress";

export type PreCompressItem = {
  key: string;
  /** file:// prefixed input path */
  path: string;
  /** mime type used to detect png/jpeg. */
  mime?: string;
  size?: number;
};

/**
 * Compresses png/jpeg images one at a time in the background so their final
 * size can be shown before they are attached. Every key is compressed once;
 * items added later are queued too.
 */
export function usePreCompressedImages(
  items: PreCompressItem[],
  enabled: boolean
) {
  // null = failed to compress. A key that is not in results is still pending.
  const [results, setResults] = useState<
    Record<string, CompressedImage | null>
  >({});
  const started = useRef(new Set<string>());
  const temp = useRef(new Map<string, string>());
  const queue = useRef(Promise.resolve());
  const disposed = useRef(false);
  const handedOff = useRef(false);

  useEffect(() => {
    for (const item of items) {
      const type = getCompressionType(item.mime);
      if (!type || started.current.has(item.key)) continue;
      started.current.add(item.key);
      queue.current = queue.current.then(async () => {
        if (disposed.current) return;
        const res = await compressImage(item.path, type, item.size).catch(
          (e) => {
            console.error("Failed to pre-compress image", e);
            return null;
          }
        );
        if (disposed.current) {
          if (res && !res.original) unlinkFile(res.uri);
          return;
        }
        if (res && !res.original) temp.current.set(item.key, res.uri);
        setResults((prev) => ({ ...prev, [item.key]: res }));
      });
    }
  }, [items]);

  const dispose = useCallback(() => {
    disposed.current = true;
    if (!handedOff.current) temp.current.forEach(unlinkFile);
  }, []);

  useEffect(() => dispose, [dispose]);

  const isPending = (item: PreCompressItem) =>
    enabled && !!getCompressionType(item.mime) && !(item.key in results);
  const sizeOf = (item: PreCompressItem) =>
    (enabled && results[item.key]?.size) || item.size || 0;

  return {
    isPending,
    sizeOf,
    isCompressing: items.some(isPending),
    totalSize: items.reduce((total, item) => total + sizeOf(item), 0),
    /**
     * Hand the results off to the consumer, which becomes responsible for the
     * temp files. Temp files that are not handed off are deleted.
     */
    take: () => {
      handedOff.current = true;
      disposed.current = true;
      const taken: Record<string, CompressedImage> = {};
      for (const item of items) {
        const res = results[item.key];
        if (res) taken[item.key] = res;
      }
      // Delete temp files of removed items or not yet in state.
      temp.current.forEach((uri, key) => {
        if (taken[key]?.uri !== uri) unlinkFile(uri);
      });
      return taken;
    },
    dispose
  };
}
