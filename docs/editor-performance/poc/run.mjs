import { spawn } from "node:child_process";
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const DIR = path.dirname(fileURLToPath(import.meta.url));
const PORT = 8791;
const CDP_PORT = 9333;
const BLOCKS = Number(process.argv[2] || 1000);

// ---- static server ----
const server = http.createServer((req, res) => {
  const f = path.join(DIR, req.url === "/" ? "poc.html" : req.url.split("?")[0]);
  if (!fs.existsSync(f)) { res.writeHead(404); return res.end("nf"); }
  res.writeHead(200, { "Content-Type": f.endsWith(".html") ? "text/html" : "application/javascript" });
  res.end(fs.readFileSync(f));
});
await new Promise((r) => server.listen(PORT, r));

// ---- launch chrome ----
const userDir = path.join(DIR, ".chrome-profile");
const chrome = spawn("/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", [
  "--headless=new",
  `--remote-debugging-port=${CDP_PORT}`,
  `--user-data-dir=${userDir}`,
  "--no-first-run", "--no-default-browser-check", "--disable-gpu",
  "--window-size=1200,900",
  `http://localhost:${PORT}/poc.html`
], { stdio: ["ignore", "pipe", "pipe"] });

let stderr = "";
chrome.stderr.on("data", (d) => { stderr += d.toString(); });

async function getWsUrl() {
  for (let i = 0; i < 100; i++) {
    try {
      const r = await fetch(`http://localhost:${CDP_PORT}/json/list`);
      const tabs = await r.json();
      const t = tabs.find((t) => t.type === "page" && t.webSocketDebuggerUrl);
      if (t) return t.webSocketDebuggerUrl;
    } catch {}
    await new Promise((r) => setTimeout(r, 200));
  }
  throw new Error("no chrome target. stderr:\n" + stderr);
}

const wsUrl = await getWsUrl();
const ws = new WebSocket(wsUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });

let msgId = 0;
const pending = new Map();
ws.onmessage = (e) => {
  const m = JSON.parse(e.data);
  if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
};
function send(method, params = {}) {
  const id = ++msgId;
  ws.send(JSON.stringify({ id, method, params }));
  return new Promise((r) => pending.set(id, r));
}

async function evaluate(expr, awaitPromise = false) {
  const r = await send("Runtime.evaluate", {
    expression: expr, returnByValue: true, awaitPromise
  });
  if (r.result?.exceptionDetails) {
    throw new Error(JSON.stringify(r.result.exceptionDetails, null, 2));
  }
  if (r.result?.result?.subtype === "error") {
    throw new Error(r.result.result.description);
  }
  return r.result?.result?.value;
}

await send("Runtime.enable");
await send("Page.enable");

// wait for load
for (let i = 0; i < 100; i++) {
  const ready = await evaluate("window.__ready === true").catch(() => false);
  if (ready) break;
  await new Promise((r) => setTimeout(r, 200));
}

const ua = await evaluate("navigator.userAgent");
const results = await evaluate(`JSON.stringify(window.runProofs(${BLOCKS}))`);
const parsed = JSON.parse(results);

console.log(JSON.stringify({ userAgent: ua, blocks: BLOCKS, ...parsed }, null, 2));

ws.close();
chrome.kill();
server.close();
fs.rmSync(userDir, { recursive: true, force: true });
process.exit(0);
