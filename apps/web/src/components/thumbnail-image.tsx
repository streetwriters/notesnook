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
import { useEffect, useRef, useState } from "react";
import { db } from "../common/db";
import { logger } from "../utils/logger";

interface Props {
  hash: string;
  className?: string;
  alt?: string;
  style?: React.CSSProperties;
}

const ThumbnailImage = ({ hash, className, alt, ...props }: Props) => {
  const [src, setSrc] = useState<string | null>(null);
  const elementRef = useRef<HTMLImageElement>(null);
  const observer = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    // Reset src if hash changes
    setSrc(null);
  }, [hash]);

  useEffect(() => {
    // Clean up previous observer
    if (observer.current) {
      observer.current.disconnect();
    }

    if (!hash) return;
    if (!elementRef.current) return;

    // Use IntersectionObserver to lazy load the image
    observer.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
            loadThumbnail(hash);
            observer.current?.disconnect();
        }
      },
      {
        rootMargin: "100px", // Load before it comes into view
        threshold: 0.1,
      }
    );

    observer.current.observe(elementRef.current);

    return () => {
      if (observer.current) {
        observer.current.disconnect();
      }
    };
  }, [hash]);

  const loadThumbnail = async (hash: string) => {
    try {
      if (!(await db.fs().exists(hash))) {
        const attachment = await db.attachments.attachment(hash);
        if (attachment && attachment.dateUploaded) {
          await db.fs().downloadFile("offline-mode", hash, attachment.chunkSize);
        }
      }
      const result = await db.attachments.read(hash, "base64");
      if (typeof result === "string") {
        const attachment = await db.attachments.attachment(hash);
        if (attachment) {
          const src = result.startsWith("data:")
            ? result
            : `data:${attachment.mimeType};base64,${result}`;
          setSrc(src);
        }
      }
    } catch (e) {
      logger.error("Failed to load thumbnail", e);
    }
  };

  return (
    <img
      ref={elementRef}
      src={src || "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"} // placeholder
      className={className}
      alt={alt || "Note thumbnail"}
      loading="lazy"
      style={{ objectFit: "cover", width: "100%", height: "100%", display: "block", ...props.style }}
    />
  );
};

export default ThumbnailImage;
