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
const { writeFileSync, rmSync } = require("fs");
const { execSync } = require("child_process");
const { relative, join } = require("path");

module.exports = async function (configuration) {
  if (process.env.NOTESNOOK_STAGING) return;

  const Endpoint = "https://weu.codesigning.azure.net";
  const CodeSigningAccountName = "Notesnook";
  const CertificateProfileName = "Notesnook";
  const FileDigest = configuration.hash.toUpperCase();
  const TimestampRfc3161 = "http://timestamp.acs.microsoft.com";
  const TimestampDigest = configuration.hash.toUpperCase();
  const Description = "The Notesnook app";
  const DescriptionUrl = "https://notesnook.com/";
  const FilesCatalog = createCatalog(configuration.path);

  const command = `Invoke-TrustedSigning -Endpoint "${Endpoint}" -CodeSigningAccountName "${CodeSigningAccountName}" -CertificateProfileName "${CertificateProfileName}" -FileDigest "${FileDigest}" -TimestampRfc3161 "${TimestampRfc3161}" -TimestampDigest "${TimestampDigest}" -Description "${Description}" -DescriptionUrl "${DescriptionUrl}" -FilesCatalog "${FilesCatalog}"`;

  console.debug("Signing", configuration.path, "using command", command);

  psexec(command);

  console.debug("Signed", configuration.path);

  rmSync(FilesCatalog);
};

function createCatalog(path) {
  const catalogPath = join(__dirname, "_catalog");
  writeFileSync(catalogPath, relative(__dirname, path));
  return catalogPath;
}

function psexec(cmd) {
  return execSync(cmd, {
    env: process.env,
    stdio: "inherit",
    shell: "pwsh"
  });
}
