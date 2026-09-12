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
import {
  Copy,
  Download,
  FloppyDisk,
  RecoveryKeyShieldCheck
} from "../components/icons";
import { ScrollContainer } from "@notesnook/ui";

const QRCode = React.lazy(() => import("../re-exports/react-qrcode-logo"));
type RecoveryKeyDialogProps = BaseDialogProps<false>;
export const RecoveryKeyDialog = DialogManager.register(
  function RecoveryKeyDialog(props: RecoveryKeyDialogProps) {
    const key = usePromise(() =>
      db.user.getMasterKey().then((key) => key?.key)
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

export function SaveRecoveryKey({ recoveryKey }: { recoveryKey?: string }) {
  const [activeButton, setActiveButton] = useState<string | null>(null);

  function flash(key: string) {
    setActiveButton(key);
    setTimeout(() => setActiveButton(null), 2000);
  }

  const handleCopy = async () => {
    if (!recoveryKey) return;
    await writeText(recoveryKey);
    flash("copy");
  };

  const handleSaveToFile = async () => {
    if (!recoveryKey) return;

    const email = (await db.user.getUser())?.email || "user";
    FileSaver.saveAs(
      new Blob([recoveryKey]),
      `${email}-notesnook-recoverykey.txt`
    );
    flash("download");
  };

  const handleCopyQRCode = async () => {
    const qrcode = document.getElementById(
      "react-qrcode-logo"
    ) as HTMLCanvasElement | null;
    if (!qrcode) return;

    qrcode.toBlob(async (blob) => {
      if (!blob) return;

      try {
        await navigator.clipboard.write([
          new ClipboardItem({ [blob.type]: blob })
        ]);
      } catch {
        if (recoveryKey) await writeText(recoveryKey);
      }
      flash("copyQR");
    });
  };

  const handleDownloadQRCode = async () => {
    const email = (await db.user.getUser())?.email || "user";
    const qrcode = document.getElementById(
      "react-qrcode-logo"
    ) as HTMLCanvasElement | null;
    if (!qrcode) return;

    qrcode.toBlob((blob) => {
      if (!blob) return;

      FileSaver.saveAs(blob, `${email}-notesnook-recoverykey.png`);
      flash("saveQR");
    });
  };

  return (
    <>
      <Flex
        sx={{
          flexDirection: "column",
          gap: "spacing4",
          bg: "background-secondary",
          px: "spacing3",
          py: "spacing4",
          borderRadius: "radius2",
          width: "100%"
        }}
      >
        <Flex
          sx={{
            alignItems: "center",
            gap: "spacing3"
          }}
        >
          <RecoveryKeyShieldCheck size={15} color="accent" />
          <Text
            sx={{
              fontSize: "xs",
              fontWeight: 400,
              color: "accent"
            }}
          >
            Save Your Recovery Key
          </Text>
        </Flex>
        <Flex
          sx={{
            bg: "background-tertiary",
            border: "1px dashed var(--accent)",
            borderRadius: "radius2",
            p: "spacing4",
            alignItems: "center",
            justifyContent: "space-between",
            width: "100%"
          }}
        >
          <ScrollContainer
            trackStyle={() => ({
              backgroundColor: "transparent",
              "--ms-track-size": "3px"
            })}
            thumbStyle={() => ({ height: 3 })}
            style={{ flex: "1 0 0", minWidth: 0 }}
          >
            <Text
              sx={{
                userSelect: "text",
                lineHeight: 1,
                color: "paragraph",
                fontWeight: 400,
                fontSize: "xxs"
              }}
            >
              {recoveryKey ? recoveryKey : strings.loading()}
            </Text>
          </ScrollContainer>
          <Flex
            sx={{
              alignItems: "center",
              gap: "spacing3",
              flexShrink: 0,
              cursor: "pointer"
            }}
            onClick={handleCopy}
          >
            <Copy size={15} color="accent" />
            <Text
              sx={{
                fontSize: "xs",
                fontWeight: 500,
                color: "accent"
              }}
            >
              {activeButton === "copy" ? "Copied!" : "Copy"}
            </Text>
          </Flex>
        </Flex>
      </Flex>
      <Flex
        sx={{
          flexDirection: "row",
          gap: "spacing4",
          bg: "background-secondary",
          p: "spacing4",
          borderRadius: "radius2",
          width: "100%"
        }}
      >
        <Suspense fallback={<div />}>
          <Flex
            sx={{
              position: "relative",
              bg: "background",
              border: "1px solid var(--border-secondary)",
              flexShrink: 0
            }}
          >
            <QRCode
              value={recoveryKey || ""}
              logoImage={Logo}
              logoWidth={40}
              logoHeight={40}
              ecLevel={"M"}
              logoPaddingStyle="square"
            />
          </Flex>
        </Suspense>
        <Flex
          sx={{
            flex: "1 0 0",
            flexDirection: "column",
            gap: "spacing3",
            justifyContent: "center",
            minWidth: 0
          }}
        >
          <Button
            type="button"
            variant="new_anchor"
            onClick={handleCopyQRCode}
            sx={{
              display: "flex",
              alignItems: "center",
              gap: "spacing3",
              bg: "background",
              border: "1px solid var(--border)",
              borderRadius: "radius2",
              p: "spacing4",
              textDecoration: "none",
              width: "100%"
            }}
          >
            <Flex
              sx={{
                width: 30,
                height: 30,
                borderRadius: "5px",
                bg: "rgba(0,136,54,0.1)",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0
              }}
            >
              <Copy size={15} color="icon" />
            </Flex>
            <Text
              sx={{
                fontSize: "sm",
                fontWeight: 500,
                color: "heading"
              }}
            >
              {activeButton === "copyQR" ? "Copied!" : "Copy to clipboard"}
            </Text>
          </Button>
          <Button
            type="button"
            variant="new_anchor"
            onClick={handleDownloadQRCode}
            sx={{
              display: "flex",
              alignItems: "center",
              gap: "spacing3",
              bg: "background",
              border: "1px solid var(--border)",
              borderRadius: "radius2",
              p: "spacing4",
              textDecoration: "none",
              width: "100%"
            }}
          >
            <Flex
              sx={{
                width: 30,
                height: 30,
                borderRadius: "5px",
                bg: "rgba(0,136,54,0.1)",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0
              }}
            >
              <FloppyDisk size={15} color="icon" />
            </Flex>
            <Text
              sx={{
                fontSize: "sm",
                fontWeight: 500,
                color: "heading"
              }}
            >
              {activeButton === "saveQR" ? "Saved!" : "Save QR image"}
            </Text>
          </Button>
          <Button
            type="button"
            variant="new_anchor"
            onClick={handleSaveToFile}
            sx={{
              display: "flex",
              alignItems: "center",
              gap: "spacing3",
              bg: "background",
              border: "1px solid var(--border)",
              borderRadius: "radius2",
              p: "spacing4",
              textDecoration: "none",
              width: "100%"
            }}
          >
            <Flex
              sx={{
                width: 30,
                height: 30,
                borderRadius: "5px",
                bg: "rgba(0,136,54,0.1)",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0
              }}
            >
              <Download size={15} color="icon" />
            </Flex>
            <Text
              sx={{
                fontSize: "sm",
                fontWeight: 500,
                color: "heading"
              }}
            >
              {activeButton === "download"
                ? "Downloaded!"
                : "Download text file"}
            </Text>
          </Button>
        </Flex>
      </Flex>
    </>
  );
}
