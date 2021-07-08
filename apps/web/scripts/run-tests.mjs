const find = require("find-process");

const { p, u, f } = argv;

const args = [];
if (u) args.push("-u");
if (f) args.push(f);

const res = nothrow($`yarn debug -p ${p || 3000}`);
res.stdout.on("data", async (data) => {
  const message = data.toString();
  if (
    message.includes("create a production build, use yarn build.") ||
    message.includes("Compiled with warnings")
  ) {
    const testRes = await $`yarn playwright test ${args.join(" ")}`;
    await killServer();
    process.exit(testRes.exitCode);
  }
});

async function killServer() {
  const nodeProcesses = await find("name", "node");
  const reactServerProcesses = nodeProcesses.filter((p) =>
    p.cmd.includes("react-scripts")
  );
  for (let rprocess of reactServerProcesses) {
    process.kill(rprocess.pid, "SIGINT");
  }
}
