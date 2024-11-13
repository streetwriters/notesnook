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
import { bench, run, summary } from "mitata";
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
    name: "signup page load",
    start: "start:app",
    end: "load:auth",
    route: "/signup"
  }
];

async function startServer() {
  return new Promise((resolve, reject) => {
    const server = spawn("npx", ["serve", "-s", "build"]);

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

for (const testCase of TESTS) {
  summary(() => {
    bench(testCase.name, async function* () {
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
            window.close();
          }
        });
      });
      observer.observe({ entryTypes: ["mark"] });`
      });
      const page = await context.newPage();

      yield async () => {
        await page.goto(testCase.route || "/");
        await page.waitForEvent("console", {
          predicate(consoleMessage) {
            return consoleMessage.text().startsWith(`ended: ${testCase.name}`);
          }
        });
      };

      await context.close();
    });
  });
}

await run();

await browser.close();

server.stdout.destroy();
server.stderr.destroy();
server.kill();
