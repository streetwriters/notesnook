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

import { chromium } from "playwright";
import { spawn } from "child_process";

const TESTS = [
  {
    name: "root import",
    start: "import:root",
    end: "start:app"
  },
  {
    name: "app startup",
    start: "start:app",
    end: "render:app"
  },
  {
    name: "database load",
    start: "load:database",
    end: "render:app"
  },
  {
    name: "initialize database",
    start: "start:initializeDatabase",
    end: "end:initializeDatabase"
  },
  {
    name: "init db",
    start: "start:initdb",
    end: "end:initdb"
  },
  {
    name: "signup page load",
    start: "start:app",
    end: "load:auth",
    route: "/signup"
  }
];

const serverKillSignal = new AbortController();
async function startServer() {
  return new Promise((resolve, reject) => {
    const server = spawn("npx", ["serve", "-s", "build"], {
      signal: serverKillSignal.signal
    });

    server.stdout.on("data", (data) => {
      if (data.toString().includes("Accepting connections")) {
        console.log(data.toString());
        resolve(server);
      }
    });

    server.stderr.on("data", (data) => {
      reject(data.toString());
    });

    server.on("error", (error) => {
      reject(error);
    });
  });
}

const server = await startServer();

const browser = await chromium.launch();
const ITERATIONS = 10;
for (const testCase of TESTS) {
  console.log(`Running ${testCase.name}`);
  const durations = [];
  for (let i = 0; i < ITERATIONS; i++) {
    const context = await browser.newContext({
      baseURL: "http://localhost:3000"
    });
    await context.addInitScript({
      content: `window.localStorage.setItem("skipInitiation", "true");

    const observer = new PerformanceObserver((list, observer) => {
      list.getEntries().forEach((entry) => {
        if (entry.entryType === "mark" && entry.name === "${testCase.end}") {
          observer.disconnect();
          console.log(
            "ended: ${testCase.name}",
            performance.measure(
              "${testCase.end}",
              "${testCase.start}",
              "${testCase.end}"
            ).duration
          );
        }
      });
    });
    observer.observe({ entryTypes: ["mark"] });`
    });
    const page = await context.newPage();

    await page.goto(testCase.route || "/");
    const result = await page.waitForEvent("console", (msg) =>
      msg.text().startsWith(`ended: ${testCase.name}`)
    );
    durations.push(await result.args()[1].jsonValue());

    await context.close();
  }

  const mean = durations.reduce((a, b) => a + b) / durations.length;
  const max = Math.max(...durations);
  const min = Math.min(...durations);
  console.log(
    `${testCase.name} took ${mean}ms on average | ${max}ms max | ${min}ms min`
  );
}

console.log("done");
await browser.close();

server.stdout.destroy();
server.stderr.destroy();
server.kill("SIGKILL");
console.log(server.killed);
serverKillSignal.abort("finished");
