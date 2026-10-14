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

export type S3Error = { Code: string; Message: string };

export function parseS3Error(data?: ArrayBuffer | unknown): S3Error {
  let parsedJson: any = null;
  if (typeof data === "string") {
    try {
      parsedJson = JSON.parse(data);
    } catch {}
  }

  const targetData = parsedJson || data;

  const text =
    targetData instanceof ArrayBuffer
      ? new TextDecoder().decode(targetData)
      : typeof targetData === "string"
      ? targetData
      : typeof targetData === "object" &&
        targetData &&
        "error" in targetData &&
        typeof targetData.error === "string"
      ? targetData.error
      : typeof targetData === "object" &&
        targetData &&
        "message" in targetData &&
        typeof targetData.message === "string"
      ? targetData.message
      : null;

  const error: S3Error = {
    Code: "UNKNOWN",
    Message:
      text ||
      (typeof data === "string" ? data : JSON.stringify(data)) ||
      "Upload error"
  };

  try {
    if (!text) return error;

    // Fast and universal XML tag extraction (works across Node, Browser, React Native)
    const codeMatch = text.match(/<Code>(.*?)<\/Code>/i);
    const msgMatch = text.match(/<Message>(.*?)<\/Message>/i);

    if (codeMatch && codeMatch[1]) {
      error.Code = codeMatch[1].trim();
    }
    if (msgMatch && msgMatch[1]) {
      error.Message = msgMatch[1].trim();
    }

    return error;
  } catch {
    return error;
  }
}

export function formatS3Error(error: S3Error, message?: string): string {
  const msg = `${message ? message + " " : ""}${error.Message}`;
  return error.Code === "UNKNOWN" || error.Code === "Unknown"
    ? msg
    : `[${error.Code}] ${msg}`;
}

export function isTerminalError(error: unknown): boolean {
  const msg =
    error instanceof Error
      ? error.message
      : typeof error === "string"
      ? error
      : "";
  return (
    /^(400|401|402|403|413)\b/.test(msg) ||
    /\((400|401|402|403|413)\)/.test(msg)
  );
}

export function formatFailureReason(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === "string") {
    return error;
  }
  const s3 = parseS3Error(error);
  return formatS3Error(s3);
}
