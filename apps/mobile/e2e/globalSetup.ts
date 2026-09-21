import { execSync } from "child_process";
import { existsSync } from "fs";
import { mkdir } from "fs/promises";

import { resolveConfig } from "detox/internals";
import { globalSetup } from "detox/runners/jest";

export default async function customGlobalSetup() {
  const config = await resolveConfig();
  //@ts-ignore
  globalThis["DEBUG_MODE"] = config.configurationName;
  if (config.device.type === "android.emulator") {
    await downloadTestButlerAPK();
  }

  await globalSetup();
}

async function downloadTestButlerAPK() {
  const version = "2.2.1";
  const artifactUrl = `https://repo1.maven.org/maven2/com/linkedin/testbutler/test-butler-app/${version}/test-butler-app-${version}.apk`;
  const filePath = `cache/test-butler-app.apk`;

  await mkdir("cache", { recursive: true });
  if (!existsSync(filePath)) {
    console.log(`\nDownloading Test-Butler APK v${version}...`);
    execSync(`curl -f -o ${filePath} ${artifactUrl}`);
  }
}

module.exports = customGlobalSetup;
