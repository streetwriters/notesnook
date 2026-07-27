import { spawn } from "node:child_process";
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const DIR = path.dirname(fileURLToPath(import.meta.url));
const PORT = 8792, CDP_PORT = 9334;

const server = http.createServer((req, res) => {
  const f = path.join(DIR, req.url === "/" ? "proof2.html" : req.url.split("?")[0]);
  if (!fs.existsSync(f)) { res.writeHead(404); return res.end("nf"); }
  res.writeHead(200, { "Content-Type": f.endsWith(".html") ? "text/html" : "application/javascript" });
  res.end(fs.readFileSync(f));
});
await new Promise((r) => server.listen(PORT, r));

const userDir = path.join(DIR, ".chrome-profile2");
const chrome = spawn("/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", [
  "--headless=new", `--remote-debugging-port=${CDP_PORT}`, `--user-data-dir=${userDir}`,
  "--no-first-run", "--no-default-browser-check", "--disable-gpu", "--window-size=1200,900",
  `http://localhost:${PORT}/proof2.html`
], { stdio: ["ignore", "pipe", "pipe"] });
let stderr = ""; chrome.stderr.on("data", (d) => { stderr += d; });

async function wsUrl() {
  for (let i = 0; i < 100; i++) {
    try {
      const tabs = await (await fetch(`http://localhost:${CDP_PORT}/json/list`)).json();
      const t = tabs.find((t) => t.type === "page" && t.webSocketDebuggerUrl);
      if (t) return t.webSocketDebuggerUrl;
    } catch {}
    await new Promise((r) => setTimeout(r, 200));
  }
  throw new Error("no target " + stderr);
}
const ws = new WebSocket(await wsUrl());
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
let id = 0; const pend = new Map();
ws.onmessage = (e) => { const m = JSON.parse(e.data); if (m.id && pend.has(m.id)) { pend.get(m.id)(m); pend.delete(m.id); } };
const send = (method, params = {}) => { const i = ++id; ws.send(JSON.stringify({ id: i, method, params })); return new Promise((r) => pend.set(i, r)); };
async function ev(expr) {
  const r = await send("Runtime.evaluate", { expression: expr, returnByValue: true, awaitPromise: true });
  if (r.result?.exceptionDetails) throw new Error(JSON.stringify(r.result.exceptionDetails?.exception?.description || r.result.exceptionDetails));
  return r.result?.result?.value;
}
await send("Runtime.enable");
for (let i = 0; i < 100; i++) { if (await ev("window.__ready2===true").catch(() => false)) break; await new Promise((r) => setTimeout(r, 200)); }

const out = {};
out.differentialFuzz = [
  JSON.parse(await ev("JSON.stringify(window.differentialFuzz(200, 150, 1))")),
  JSON.parse(await ev("JSON.stringify(window.differentialFuzz(400, 150, 42))")),
  JSON.parse(await ev("JSON.stringify(window.differentialFuzz(100, 200, 7))"))
];
out.selectAllReplace = JSON.parse(await ev("JSON.stringify(window.selectAllReplace(500))"));
out.scaleSweep = JSON.parse(await ev("JSON.stringify(window.scaleSweep([200,500,1000,2000,4000]))"));
out.findInPage = JSON.parse(await ev("JSON.stringify(window.findInPageCheck(400))"));

console.log(JSON.stringify(out, null, 2));
ws.close(); chrome.kill(); server.close();
fs.rmSync(userDir, { recursive: true, force: true });
process.exit(0);
