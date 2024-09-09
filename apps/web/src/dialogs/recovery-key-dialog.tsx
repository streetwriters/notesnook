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

import React, { useState } from "react";
import { Text, Flex, Button } from "@theme-ui/components";
import Dialog from "../components/dialog";
import { db } from "../common/db";
import Logo from "../assets/notesnook-logo.png";
import { writeText } from "clipboard-polyfill";
import { Suspense } from "react";
import Config from "../utils/config";
import FileSaver from "file-saver";
import { ErrorText } from "../components/error-text";
import { BaseDialogProps, DialogManager } from "../common/dialog-manager";
import { usePromise } from "@notesnook/common";
import { Loader } from "../components/loader";
import { showToast } from "../utils/toast";
import { strings } from "@notesnook/intl";

const QRCode = React.lazy(() => import("../re-exports/react-qrcode-logo"));
type RecoveryKeyDialogProps = BaseDialogProps<false>;
export const RecoveryKeyDialog = DialogManager.register(
  function RecoveryKeyDialog(props: RecoveryKeyDialogProps) {
    const key = usePromise(() =>
      db.user.getEncryptionKey().then((key) => key?.key)
    );
    const [copyText, setCopyText] = useState("Copy to clipboard");

    return (
      <Dialog
        testId="recovery-key-dialog"
        isOpen={true}
        title={strings.saveRecoveryKey()}
        width={400}
        positiveButton={{
          text: strings.keyBackedUp(),
          onClick: () => {
            Config.set("recoveryKeyBackupDate", Date.now());
            props.onClose(false);
          }
        }}
      >
        {key.status !== "fulfilled" ? (
          <Loader title={strings.gettingEncryptionKey()} />
        ) : (
          <Flex sx={{ overflow: "hidden", flex: 1, flexDirection: "column" }}>
            <Flex sx={{ overflowY: "auto", flexDirection: "column" }}>
              <ErrorText error={strings.saveRecoveryKeyDesc()} mt={0} />
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
                {key.value}
              </Text>
              <Flex
                mt={4}
                sx={{ alignItems: "center", justifyContent: "space-around" }}
              >
                <Suspense fallback={<div />}>
                  <QRCode
                    value={key.value}
                    logoImage={Logo}
                    logoWidth={40}
                    logoHeight={40}
                    ecLevel={"M"}
                  />
                </Suspense>
                <Flex sx={{ flexDirection: "column" }}>
                  <Button
                    variant="secondary"
                    mt={1}
                    className="copyKey"
                    onClick={async () => {
                      if (!key.value)
                        return showToast(
                          "error",
                          strings.noEncryptionKeyFound()
                        );

                      writeText(key.value)
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
                      const email = await db.user
                        .getUser()
                        .then((user) => user?.email || "user");
                      const qrcode = document.getElementById(
                        "react-qrcode-logo"
                      ) as HTMLCanvasElement | null;
                      qrcode?.toBlob((blob) => {
                        blob
                          ? FileSaver.saveAs(
                              blob,
                              `${email}-notesnook-recoverykey.png`
                            )
                          : null;
                      });
                    }}
                    sx={{ fontSize: "body" }}
                  >
                    {strings.saveQRCode()}
                  </Button>
                  <Button
                    variant="secondary"
                    mt={1}
                    onClick={async () => {
                      if (!key.value)
                        return showToast(
                          "error",
                          strings.noEncryptionKeyFound()
                        );
                      const email = await db.user
                        .getUser()
                        .then((user) => user?.email || "user");
                      FileSaver.saveAs(
                        new Blob([Buffer.from(key.value)]),
                        `${email}-notesnook-recoverykey.txt`
                      );
                    }}
                    sx={{ fontSize: "body" }}
                  >
                    {strings.network.download()}
                  </Button>
                </Flex>
              </Flex>
            </Flex>
          </Flex>
        )}
      </Dialog>
    );
  }
);
