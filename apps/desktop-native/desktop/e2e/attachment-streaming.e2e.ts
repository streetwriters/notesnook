import { execFileSync } from "node:child_process";
import { createHash, randomBytes } from "node:crypto";
import {
  createReadStream,
  createWriteStream,
  existsSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
  appendFileSync
} from "node:fs";
import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import { tmpdir } from "node:os";
import path from "node:path";
import { pipeline } from "node:stream/promises";
import { afterAll, beforeAll, describe, expect, test, vi } from "vitest";
import { type DesktopApp } from "@react-native-gpui/testing";
import { start } from "./dialogs";

const MB = 1024 * 1024;
const SIZE = Number(process.env.ATTACHMENT_E2E_MB ?? 200) * MB;
const ENCRYPTED_PER_CHUNK = 17;
const CHUNK = 512 * 1024;

const work = mkdtempSync(path.join(tmpdir(), "attachment-e2e-"));
const sourcePath = path.join(work, "source.bin");
const outputPath = path.join(work, "output.bin");
const statusPath = path.join(work, "status.json");
const objects = new Map<string, string>();
const uploads = new Map<string, Map<number, string>>();
const requests: string[] = [];
let server: Server;
let apiHost = "";
let app: DesktopApp | undefined;

function hashOf(file: string) {
  return new Promise<string>((resolve, reject) => {
    const hash = createHash("sha256");
    createReadStream(file)
      .on("data", (d) => hash.update(d))
      .on("end", () => resolve(hash.digest("hex")))
      .on("error", reject);
  });
}

function rssKb(pid: number) {
  return Number(
    execFileSync("ps", ["-o", "rss=", "-p", String(pid)])
      .toString()
      .trim()
  );
}

function writeSource() {
  writeFileSync(sourcePath, "");
  const block = randomBytes(8 * MB);
  for (let written = 0; written < SIZE; written += block.length) {
    block.writeUInt32LE(written / MB, 0);
    appendFileSync(
      sourcePath,
      block.subarray(0, Math.min(block.length, SIZE - written))
    );
  }
}

function startServer() {
  server = createServer(async (req, res) => {
    const url = new URL(req.url ?? "/", "http://localhost");
    requests.push(`${req.method} ${url.pathname}`);
    const name = url.searchParams.get("name") ?? "";
    const json = (body: unknown, status = 200) => {
      res.writeHead(status, { "content-type": "application/json" });
      res.end(JSON.stringify(body));
    };
    if (
      req.headers.authorization !== "Bearer e2e-token" &&
      url.pathname.startsWith("/s3")
    ) {
      res.writeHead(401).end();
      return;
    }
    if (url.pathname === "/s3" && req.method === "HEAD") {
      const file = objects.get(name);
      res.writeHead(200, {
        "x-object-size": file ? String(statSync(file).size) : "0"
      });
      res.end();
    } else if (url.pathname === "/s3" && req.method === "GET") {
      res.writeHead(200, { "content-type": "text/plain" });
      res.end(`${apiHost}/object/${name}`);
    } else if (url.pathname === "/s3" && req.method === "DELETE") {
      objects.delete(name);
      res.writeHead(200).end();
    } else if (url.pathname === "/s3/multipart" && req.method === "GET") {
      const parts = Number(url.searchParams.get("parts"));
      const uploadId = `upload-${name}`;
      uploads.set(uploadId, new Map());
      json({
        uploadId,
        parts: Array.from(
          { length: parts },
          (_, i) => `${apiHost}/part/${uploadId}/${i + 1}`
        )
      });
    } else if (url.pathname === "/s3/multipart" && req.method === "POST") {
      const chunks: Buffer[] = [];
      for await (const c of req) chunks.push(c as Buffer);
      const body = JSON.parse(Buffer.concat(chunks).toString());
      const stored = uploads.get(body.UploadId)!;
      const target = path.join(work, `object-${body.Key}`);
      writeFileSync(target, "");
      for (const { PartNumber } of body.PartETags)
        appendFileSync(target, readFileSync(stored.get(PartNumber)!));
      objects.set(body.Key, target);
      json({});
    } else if (url.pathname.startsWith("/part/") && req.method === "PUT") {
      const [, , uploadId, number] = url.pathname.split("/");
      const file = path.join(work, `part-${uploadId}-${number}`);
      await pipeline(req, createWriteStream(file));
      uploads.get(uploadId)!.set(Number(number), file);
      res.writeHead(200, { etag: `"etag-${number}"` }).end();
    } else if (url.pathname.startsWith("/object/") && req.method === "PUT") {
      const file = path.join(work, `object-${url.pathname.slice(8)}`);
      await pipeline(req, createWriteStream(file));
      objects.set(url.pathname.slice(8), file);
      res.writeHead(200).end();
    } else if (url.pathname.startsWith("/object/") && req.method === "GET") {
      const file = objects.get(url.pathname.slice(8));
      if (!file) return void res.writeHead(404).end();
      res.writeHead(200, { "content-length": statSync(file).size });
      await pipeline(createReadStream(file), res).catch(() => {});
    } else if (url.pathname === "/s3" && req.method === "PUT") {
      res.writeHead(404).end();
    } else {
      res.writeHead(404).end();
    }
  });
  return new Promise<void>((resolve) =>
    server.listen(0, "127.0.0.1", () => {
      apiHost = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
      resolve();
    })
  );
}

describe("attachment streaming", () => {
  beforeAll(async () => {
    writeSource();
    await startServer();
  }, 300000);

  afterAll(async () => {
    await app?.close().catch(() => {});
    server?.close();
    rmSync(work, { recursive: true, force: true });
  });

  test(`uploads, downloads and opens a ${
    SIZE / MB
  } MB attachment with bounded memory`, async () => {
    app = await start(
      {
        disableNetwork: false,
        seedConfig: { serverUrls: { API_HOST: apiHost } },
        attachmentBench: {
          apiHost,
          sourcePath,
          size: SIZE,
          hash: "e2ebench0001",
          outputPath,
          statusPath
        }
      },
      true
    ).catch((e) => {
      throw e;
    });
    const pid = app.pid!;
    expect(pid).toBeGreaterThan(0);

    const peaks: Record<string, { start: number; peak: number }> = {};
    let phase = "";
    let last = "";
    const deadline = Date.now() + 600000;
    while (last !== "done" && last !== "error" && Date.now() < deadline) {
      try {
        const status = existsSync(statusPath)
          ? JSON.parse(readFileSync(statusPath, "utf8"))
          : undefined;
        if (status && status.phase !== phase) {
          if (status.phase === "error")
            throw new Error(`${phase}: ${status.message}`);
          phase = status.phase;
          peaks[phase] = { start: rssKb(pid), peak: rssKb(pid) };
        }
        last = status?.phase ?? "";
      } catch (e) {
        if ((e as Error).message && !(e instanceof SyntaxError)) throw e;
      }
      if (peaks[phase])
        peaks[phase].peak = Math.max(peaks[phase].peak, rssKb(pid));
      await new Promise((r) => setTimeout(r, 50));
    }
    expect(last).toBe("done");

    const report = Object.fromEntries(
      Object.entries(peaks).map(([k, v]) => [
        k,
        `${((v.peak - v.start) / 1024).toFixed(0)} MB growth (start ${(
          v.start / 1024
        ).toFixed(0)} MB, peak ${(v.peak / 1024).toFixed(0)} MB)`
      ])
    );
    console.log("ATTACHMENT_RSS", JSON.stringify(report, null, 1));

    const encryptedSize = SIZE + Math.ceil(SIZE / CHUNK) * ENCRYPTED_PER_CHUNK;
    expect(statSync(objects.get("e2ebench0001")!).size).toBe(encryptedSize);
    expect(requests.some((r) => r === "PUT /part/upload-e2ebench0001/1")).toBe(
      true
    );
    expect(await hashOf(outputPath)).toBe(await hashOf(sourcePath));

    for (const phaseName of ["encrypt", "upload", "download", "open"]) {
      const growth = (peaks[phaseName].peak - peaks[phaseName].start) * 1024;
      expect(growth, phaseName).toBeLessThan(SIZE / 4);
    }
  }, 900000);
});
