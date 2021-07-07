const { p, u, f } = argv;

const args = [];
if (u) args.push("-u");
if (f) args.push(f);

const res = $`yarn debug -p ${p || 3000}`;
res.stdout.on("data", async (data) => {
  const message = data.toString();
  if (message.includes("create a production build, use yarn build.")) {
    console.log("Running on", res.child.pid, process.pid, process.ppid);
    const testRes = await $`yarn playwright test`;
    process.exit(testRes.exitCode);
  }
});
