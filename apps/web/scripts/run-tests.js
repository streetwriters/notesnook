const { spawn } = require("child_process");

const PORT = 3000;
function startServer() {
  return new Promise((resolve) => {
    const process = spawn("yarn", ["debug", "-p", PORT], {
      detached: true,
      stdio: "pipe",
    });
    process.stdout.on("data", (data) => {
      const message = data.toString();
      if (message.includes("create a production build, use yarn build."))
        resolve(process);
    });
  });
}

function startTestRunner() {
  return new Promise((resolve) => {
    const process = spawn("yarn", ["playwright", "test"], {
      detached: true,
      stdio: "inherit",
    });
    process.on("close", () => resolve(process));
  });
}

(async function () {
  console.log("Starting server at port", PORT, "...");
  const server = await startServer();

  console.log("Starting tests...");
  const testRunner = await startTestRunner();

  console.log("All done.");
  process.kill(-server.pid);
  process.exit(testRunner.exitCode);
})();
