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

import React, { useEffect, useState } from "react";
import { Text, Flex, Button } from "@theme-ui/components";
import Dialog from "../components/dialog";
import { db } from "../common/db";
import Logo from "../assets/notesnook-logo.png";
import { writeText } from "clipboard-polyfill";
import { Suspense } from "react";
import Config from "../utils/config";
import FileSaver from "file-saver";
import { ErrorText } from "../components/error-text";

const QRCode = React.lazy(() => import("../re-exports/react-qrcode-logo"));

function RecoveryKeyDialog(props) {
  const [key, setKey] = useState();
  const [email, setEmail] = useState();
  const [copyText, setCopyText] = useState("Copy to clipboard");
  useEffect(() => {
    (async () => {
      const { email } = await db.user.getUser();
      const { key } = await db.user.getEncryptionKey();
      setEmail(email);
      setKey(key);
    })();
  }, []);

  return (
    <Dialog
      isOpen={true}
      title="Backup your recovery key"
      width={400}
      positiveButton={{
        text: "I have backed up my key",
        onClick: () => {
          Config.set("recoveryKeyBackupDate", Date.now());
          props.onDone();
        }
      }}
    >
      <Flex sx={{ overflow: "hidden", flex: 1, flexDirection: "column" }}>
        <Flex sx={{ overflowY: "auto", flexDirection: "column" }}>
          <ErrorText
            error="In case you forget your password, your recovery key is the only way to recover your data."
            mt={0}
          />
          <Text
            data-test-id="recovery-key"
            className="selectable"
            mt={2}
            bg="var(--background-secondary)"
            p={2}
            sx={{
              borderRadius: "default",
              overflowWrap: "anywhere",
              fontSize: "body",
              fontFamily: "monospace",
              color: "paragraph"
            }}
          >
            {key}
          </Text>
          <Flex
            mt={4}
            sx={{ alignItems: "center", justifyContent: "space-around" }}
          >
            <Suspense fallback={<div />}>
              <QRCode
                value={key}
                logoImage={Logo}
                logoWidth={25}
                ecLevel={"M"}
                logoHeight={25}
              />
            </Suspense>

            <Flex sx={{ flexDirection: "column" }}>
              <Button
                variant="secondary"
                mt={1}
                className="copyKey"
                onClick={async () => {
                  writeText(key)
                    .then(() => {
                      setCopyText("Copied!");
                      setTimeout(() => {
                        setCopyText("Copy to clipboard");
                      }, 2000);
                    })
                    .catch((e) => {
                      console.error("Error while copying text.", e);
                    });
                }}
                sx={{ fontSize: "body" }}
              >
                {copyText}
              </Button>
              <Button
                variant="secondary"
                mt={1}
                onClick={async () => {
                  const qrcode = document.getElementById("react-qrcode-logo");
                  qrcode.toBlob((blob) => {
                    FileSaver.saveAs(
                      blob,
                      `${email}-notesnook-recoverykey.png`
                    );
                  });
                }}
                sx={{ fontSize: "body" }}
              >
                Download QR Code
              </Button>
              <Button
                variant="secondary"
                mt={1}
                onClick={() => {
                  FileSaver.saveAs(
                    new Blob([Buffer.from(key)]),
                    `${email}-notesnook-recoverykey.txt`
                  );
                }}
                sx={{ fontSize: "body" }}
              >
                Download file
              </Button>
            </Flex>
          </Flex>
        </Flex>
      </Flex>
    </Dialog>
  );
}
export default RecoveryKeyDialog;
