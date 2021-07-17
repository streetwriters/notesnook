const find = require("find-process");

const { p, updateSnapshots, file, noServer } = argv;

if (!noServer) {
  await killServer();
  const res = nothrow($`yarn debug -p ${p || 3000}`);
  res.stdout.on("data", async (data) => {
    const message = data.toString();
    if (
      message.includes("create a production build, use yarn build.") ||
      message.includes("Compiled with warnings")
    ) {
      const testRes = await startTestRunner();
      await killServer();
      process.exit(testRes.exitCode);
    }
  });
} else {
  const testRes = await startTestRunner();
  process.exit(testRes.exitCode);
}

async function killServer() {
  const nodeProcesses = await find("name", "node");
  const reactServerProcesses = nodeProcesses.filter((p) =>
    p.cmd.includes("react-scripts")
  );
  for (let rprocess of reactServerProcesses) {
    process.kill(rprocess.pid, "SIGINT");
  }
}

async function startTestRunner() {
  if (!updateSnapshots && !file) return $`yarn playwright test`;
  else if (updateSnapshots && file) return $`yarn playwright test -u ${file}`;
  else if (file) return $`yarn playwright test ${file}`;
  else if (updateSnapshots) return $`yarn playwright test -u`;
}
