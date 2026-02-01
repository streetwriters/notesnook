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
import { Note, NoteContent } from "@notesnook/core";
import { getContentFromData, type Tiptap } from "@notesnook/core";
import { db } from "../common/db";
import { compressImage } from "./image-compressor";
import { FileStorage } from "../interfaces/fs";
import { logger } from "./logger";

export const ensureNoteThumbnail = async (
  note: Note,
  content: NoteContent<false>
): Promise<boolean> => {
  try {
    const tiptap = (await getContentFromData("tiptap", content.data)) as Tiptap;
    let { hash: firstImageHash, src } = tiptap.getFirstImage();
    logger.info("ensureNoteThumbnail", {
      noteId: note.id,
      firstImageHash,
      hasSrc: !!src
    });

    // If there is no image in the content, but the note has a thumbnail, we should remove it.
    if (!firstImageHash && !src) {
      if (note.thumbnail) {
        // Remove thumbnail from note
        await db.notes.add({ id: note.id, thumbnail: null as any });
        // We don't delete the attachment here as it might be used elsewhere or synced later.
        // Garbage collection should handle orphan attachments if needed.
        return true;
      }
      return false;
    }

    if (!firstImageHash && src) {
      if (!src.startsWith("data:")) return false; // External image or invalid src
      const base64Data = src.split(",")[1];
      if (!base64Data) return false;

      const { hash } = await FileStorage.hashBase64(base64Data);
      firstImageHash = hash;
    }

    if (!firstImageHash) return false;

    const thumbnailAttachment = note.thumbnail
      ? await db.attachments.attachment(note.thumbnail)
      : undefined;

    // Check if current thumbnail checks out
    if (thumbnailAttachment) {
      logger.info("ensureNoteThumbnail: Found existing thumbnail attachment", {
        filename: thumbnailAttachment.filename
      });
      if (thumbnailAttachment.filename === `thumbnail_${firstImageHash}.jpg`) {
        logger.info("ensureNoteThumbnail: Thumbnail is up to date");
        return false; // It matches!
      }
    } else {
      logger.info(
        "ensureNoteThumbnail: No existing thumbnail attachment found or note.thumbnail is null",
        { thumbnailHash: note.thumbnail }
      );
    }

    // If we are here, we need to generate a thumbnail.
    let data: string | undefined;
    let mimeType = "image/jpeg";

    if (src && !src.startsWith("http")) {
      data = src.split(",")[1];
      mimeType = src.split(";")[0]?.split(":")[1] || "image/jpeg";
    } else {
      const originalAttachment = await db.attachments.attachment(
        firstImageHash
      );
      if (!originalAttachment) {
        logger.warn("ensureNoteThumbnail: Original attachment not found", {
          firstImageHash
        });
        return false; // Original not found (maybe not synced yet?)
      }
      mimeType = originalAttachment.mimeType;

      // Read original
      data = await db.attachments.read(firstImageHash, "base64");
    }

    logger.info("ensureNoteThumbnail: Read data", { length: data?.length });

    if (!data || typeof data !== "string") {
      logger.warn("ensureNoteThumbnail: Failed to read attachment data", {
        firstImageHash
      });
      return false;
    }

    const dataUrl = data.startsWith("data:")
      ? data
      : `data:${mimeType};base64,${data}`;

    logger.info("ensureNoteThumbnail: Fetching blob");
    const blob = await (await fetch(dataUrl)).blob();
    logger.info("ensureNoteThumbnail: Blob fetched", { size: blob.size });

    const file = new File([blob], "original", {
      type: mimeType
    });

    logger.info("ensureNoteThumbnail: Starting compression", {
      size: file.size,
      type: file.type
    });

    const compressedBlob = await compressImage(file, {
      resize: "crop",
      width: 300, // Reasonable thumbnail width
      height: 300,
      quality: 0.6
    });

    if (!compressedBlob) {
      logger.warn("ensureNoteThumbnail: Compression returned null");
      return false;
    }

    // Convert back to base64 for saving
    const reader = new FileReader();
    reader.readAsDataURL(compressedBlob);

    return new Promise<boolean>((resolve, reject) => {
      reader.onloadend = async () => {
        try {
          const base64data = reader.result as string;
          const cleanBase64 = base64data.split(",")[1];

          const newThumbnailHash = await db.attachments.save(
            cleanBase64,
            "image/jpeg",
            `thumbnail_${firstImageHash}.jpg`
          );

          if (newThumbnailHash) {
            logger.info("ensureNoteThumbnail: Uploaded thumbnail", {
              thumbnailHash: newThumbnailHash
            });
            await db.notes.add({ id: note.id, thumbnail: newThumbnailHash });
            logger.info("ensureNoteThumbnail: Updated note with thumbnail");
            resolve(true);
          } else {
            resolve(false);
          }
        } catch (e) {
          reject(e);
        }
      };
      reader.onerror = reject;
    });
  } catch (error) {
    logger.error(error, "ensureNoteThumbnail: Error generating thumbnail");
    return false;
  }
};
