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
import RNFetchBlob from "react-native-blob-util";
import {
  compressImage,
  getCompressionType
} from "../common/filesystem/compress";

export type CompressedImageResult = {
  uri: string;
  size: number;
  /** Compression did not reduce the size so the original file was kept. */
  original?: boolean;
};

export type PreCompressItem = {
  key: string;
  /** file:// prefixed input path */
  path: string;
  /** mime type or path used to detect png/jpeg. */
  mime?: string;
  size?: number;
};

const unlink = (path: string) =>
  RNFetchBlob.fs.unlink(path.replace("file://", "")).catch(() => {
    /* empty */
  });

export function getImageSize(
  item: { key: string; size?: number },
  compressed: Record<string, CompressedImageResult>,
  compress: boolean
) {
  return compress ? (compressed[item.key]?.size ?? item.size) : item.size;
}

export function getTotalImageSize(
  items: { key: string; size?: number }[],
  compressed: Record<string, CompressedImageResult>,
  compress: boolean
) {
  return items.reduce(
    (acc, item) => acc + (getImageSize(item, compressed, compress) ?? 0),
    0
  );
}

/**
 * Compresses png/jpeg images one at a time in the background so their final
 * size can be shown before they are attached. Every key is compressed once;
 * items added later are queued too.
 */
export function usePreCompressedImages(items: PreCompressItem[]) {
  const [compressed, setCompressed] = useState<
    Record<string, CompressedImageResult>
  >({});
  const [settled, setSettled] = useState<Record<string, boolean>>({});
  const seenRef = useRef(new Set<string>());
  const queueRef = useRef<PreCompressItem[]>([]);
  const runningRef = useRef(false);
  const releasedRef = useRef(new Set<string>());
  const tempFilesRef = useRef<Record<string, string>>({});
  const confirmedRef = useRef(false);
  const disposedRef = useRef(false);

  const processQueue = useCallback(async () => {
    if (runningRef.current) return;
    runningRef.current = true;
    while (queueRef.current.length > 0 && !disposedRef.current) {
      const item = queueRef.current.shift() as PreCompressItem;
      try {
        const res = await compressImage(
          item.path,
          getCompressionType(item.mime ?? item.path) as "PNG" | "JPEG"
        );
        const isDiscarded = () =>
          disposedRef.current || releasedRef.current.has(item.key);
        if (isDiscarded()) {
          unlink(res.uri);
          continue;
        }

        let originalSize = item.size;
        if (!originalSize) {
          try {
            originalSize = (
              await RNFetchBlob.fs.stat(item.path.replace("file://", ""))
            ).size;
          } catch (e) {
            /* empty */
          }
          if (isDiscarded()) {
            unlink(res.uri);
            continue;
          }
        }

        let entry: CompressedImageResult = { uri: res.uri, size: res.size };
        if (originalSize && res.size >= originalSize) {
          unlink(res.uri);
          entry = { uri: item.path, size: originalSize, original: true };
        } else {
          tempFilesRef.current[item.key] = res.uri.replace("file://", "");
        }
        setCompressed((prev) => ({ ...prev, [item.key]: entry }));
      } catch (e) {
        console.error("Failed to pre-compress image", e);
      }
      if (!disposedRef.current) {
        setSettled((prev) => ({ ...prev, [item.key]: true }));
      }
    }
    runningRef.current = false;
  }, []);

  useEffect(() => {
    for (const item of items) {
      if (
        !getCompressionType(item.mime ?? item.path) ||
        seenRef.current.has(item.key)
      )
        continue;
      seenRef.current.add(item.key);
      queueRef.current.push(item);
    }
    processQueue();
  }, [items, processQueue]);

  const dispose = useCallback(() => {
    disposedRef.current = true;
    queueRef.current = [];
    if (confirmedRef.current) return;
    for (const key in tempFilesRef.current) {
      unlink(tempFilesRef.current[key]);
    }
    tempFilesRef.current = {};
  }, []);

  useEffect(() => dispose, [dispose]);

  const release = useCallback((key: string) => {
    releasedRef.current.add(key);
    queueRef.current = queueRef.current.filter((item) => item.key !== key);
    if (tempFilesRef.current[key]) {
      unlink(tempFilesRef.current[key]);
      delete tempFilesRef.current[key];
    }
    setCompressed((prev) => {
      if (!(key in prev)) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }, []);

  /** The results were handed off to the consumer, don't delete them. */
  const confirm = useCallback(() => {
    confirmedRef.current = true;
    disposedRef.current = true;
    queueRef.current = [];
  }, []);

  const isPending = (key: string) => {
    const item = items.find((item) => item.key === key);
    return (
      !disposedRef.current &&
      !!item &&
      !!getCompressionType(item.mime ?? item.path) &&
      !settled[key] &&
      !releasedRef.current.has(key)
    );
  };

  const isCompressing = items.some((item) => isPending(item.key));

  return {
    compressed,
    isPending,
    isCompressing,
    release,
    confirm,
    dispose,
    getSize: (item: { key: string; size?: number }, compress: boolean) =>
      getImageSize(item, compressed, compress),
    totalSize: (list: { key: string; size?: number }[], compress: boolean) =>
      getTotalImageSize(list, compressed, compress)
  };
}
