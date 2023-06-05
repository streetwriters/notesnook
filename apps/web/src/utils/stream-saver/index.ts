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
import { postMessage } from "./mitm";

let supportsTransferable = false;

const isSecureContext = global.isSecureContext;
// TODO: Must come up with a real detection test (#69)
let useBlobFallback =
  /constructor/i.test(global.HTMLElement.toString()) ||
  "safari" in globalThis ||
  "WebKitPoint" in globalThis;

/**
 * create a hidden iframe and append it to the DOM (body)
 */
function makeIframe(src: string, doc = true) {
  if (!src) throw new Error("meh");

  const iframe = document.createElement("iframe");
  iframe.hidden = true;
  if (doc) iframe.srcdoc = src;
  else iframe.src = src;
  document.body.appendChild(iframe);
  return iframe;
}

try {
  // We can't look for service worker since it may still work on http
  new Response(new ReadableStream());
  if (isSecureContext && !("serviceWorker" in navigator)) {
    useBlobFallback = true;
  }
} catch (err) {
  useBlobFallback = true;
}

function checkSupportsTransferable() {
  try {
    // Transferable stream was first enabled in chrome v73 behind a flag
    const { readable } = new TransformStream();
    const mc = new MessageChannel();
    mc.port1.postMessage(readable, [readable]);
    mc.port1.close();
    mc.port2.close();
    supportsTransferable = true;
  } catch {
    // ignore
  }
}
checkSupportsTransferable();

/**
 * @param  {string} filename filename that should be used
 * @param  {object} options  [description]
 * @param  {number} size     deprecated
 * @return {WritableStream<Uint8Array>}
 */
export function createWriteStream(
  filename: string,
  opts: {
    size?: number;
    pathname?: string;
    signal?: AbortSignal;
  } = {}
): WritableStream<Uint8Array> {
  // let bytesWritten = 0; // by StreamSaver.js (not the service worker)
  let downloadUrl: string | null = null;
  let channel: MessageChannel | null = null;
  let ts: TransformStream | null = null;
  let frame: HTMLIFrameElement | null = null;
  if (!useBlobFallback) {
    channel = new MessageChannel();

    // Make filename RFC5987 compatible
    filename = encodeURIComponent(filename.replace(/\//g, ":"))
      .replace(/['()]/g, escape)
      .replace(/\*/g, "%2A");
    const response: {
      transferringReadable: boolean;
      pathname: string;
      headers: Record<string, string>;
    } = {
      transferringReadable: supportsTransferable,
      pathname:
        opts.pathname || Math.random().toString().slice(-6) + "/" + filename,
      headers: {
        "Content-Type": "application/octet-stream; charset=utf-8",
        "Content-Disposition": "attachment; filename*=UTF-8''" + filename
      }
    };

    if (opts.size) {
      response.headers["Content-Length"] = `${opts.size}`;
    }

    if (supportsTransferable) {
      ts = new TransformStream();
      const readableStream = ts.readable;
      if (opts.signal) {
        opts.signal.addEventListener("abort", () => frame?.remove(), {
          once: true
        });
      }
      channel.port1.postMessage({ readableStream }, [readableStream]);
    }
    channel.port1.onmessage = async (evt) => {
      // Service worker sent us a link that we should open.
      if (evt.data.download) {
        // We never remove this iframes because it can interrupt saving
        frame = makeIframe(evt.data.download, false);
      } else if (evt.data.abort) {
        chunks = [];
        if (channel) {
          channel.port1.postMessage("abort"); //send back so controller is aborted
          channel.port1.onmessage = null;
          channel.port1.close();
          channel.port2.close();
          channel = null;
        }
      }
    };

    postMessage(response, [channel.port2]);
  }

  let chunks: Uint8Array[] = [];

  return (
    (!useBlobFallback && ts && ts.writable) ||
    new WritableStream({
      write(chunk) {
        if (!(chunk instanceof Uint8Array)) {
          throw new TypeError("Can only write Uint8Arrays");
        }
        if (useBlobFallback) {
          // Safari... The new IE6
          // https://github.com/jimmywarting/StreamSaver.js/issues/69
          //
          // even though it has everything it fails to download anything
          // that comes from the service worker..!
          chunks.push(chunk);
          return;
        }

        // is called when a new chunk of data is ready to be written
        // to the underlying sink. It can return a promise to signal
        // success or failure of the write operation. The stream
        // implementation guarantees that this method will be called
        // only after previous writes have succeeded, and never after
        // close or abort is called.

        // TODO: Kind of important that service worker respond back when
        // it has been written. Otherwise we can't handle backpressure
        // EDIT: Transferable streams solves this...
        channel?.port1.postMessage(chunk);
        // bytesWritten += chunk.length;

        if (downloadUrl) {
          window.location.href = downloadUrl;
          downloadUrl = null;
        }
      },
      close() {
        if (useBlobFallback) {
          const blob = new Blob(chunks, {
            type: "application/octet-stream; charset=utf-8"
          });
          const link = document.createElement("a");
          link.href = URL.createObjectURL(blob);
          link.download = filename;
          link.click();
        } else {
          channel?.port1.postMessage("end");
        }
      },
      abort() {
        chunks = [];
        if (channel) {
          channel.port1.postMessage("abort");
          channel.port1.onmessage = null;
          channel.port1.close();
          channel.port2.close();
          channel = null;
        }
      }
    })
  );
}
