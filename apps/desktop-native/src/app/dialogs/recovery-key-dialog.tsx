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

import { useRef, useState } from "react";
import {
  Dialog,
  Flex,
  QRCode,
  ScrollContainer,
  Text,
  dataColor,
  type QRCodeHandle
} from "@ui";
import { clipboard, files } from "@platform";
import { db } from "../common/db";
import Config from "../utils/config";
import { BaseDialogProps, DialogManager } from "../common/dialog-manager";
import { usePromise } from "@notesnook/common";
import { strings } from "@notesnook/intl";
import {
  Copy,
  Download,
  FloppyDisk,
  RecoveryKeyShieldCheck,
  type Icon
} from "../components/icons";

type RecoveryKeyDialogProps = BaseDialogProps<false>;

export const RecoveryKeyDialog = DialogManager.register(
  function RecoveryKeyDialog(props: RecoveryKeyDialogProps) {
    const key = usePromise(() =>
      db.user.getMasterKey().then((key) => key?.key)
    );

    return (
      <Dialog
        testID="recovery-key-dialog"
        isOpen={true}
        title={strings.saveRecoveryKey()}
        description={strings.saveRecoveryKeyDesc()}
        width={500}
        positiveButton={{
          text: strings.keyBackedUp(),
          onClick: () => {
            Config.set("recoveryKeyBackupDate", Date.now());
            props.onClose(false);
          }
        }}
      >
        <Flex sx={{ flexDirection: "column", mb: "spacing7" }}>
          <Flex sx={{ height: 1, bg: "separator", my: "spacing6" }} />
          {key.status !== "fulfilled" ? (
            <Text variant="body">{strings.gettingEncryptionKey()}</Text>
          ) : (
            <SaveRecoveryKey recoveryKey={key.value} />
          )}
        </Flex>
      </Dialog>
    );
  }
);

function ActionButton(props: {
  icon: Icon;
  text: string;
  onPress: () => void;
}) {
  return (
    <Flex
      onPress={props.onPress}
      sx={{
        flexDirection: "row",
        alignItems: "center",
        gap: "spacing3",
        bg: "background",
        border: "1px solid",
        borderColor: "border",
        borderRadius: "radius2",
        p: "spacing4",
        width: "100%"
      }}
    >
      <Flex
        sx={{
          width: 30,
          height: 30,
          borderRadius: 5,
          bg: dataColor("#0088361a"),
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0
        }}
      >
        <props.icon size={15} color="icon" />
      </Flex>
      <Text sx={{ fontSize: "sm", fontWeight: 500, color: "heading" }}>
        {props.text}
      </Text>
    </Flex>
  );
}

export function SaveRecoveryKey({ recoveryKey }: { recoveryKey?: string }) {
  const [activeButton, setActiveButton] = useState<string | null>(null);
  const qrRef = useRef<QRCodeHandle>(null);

  function flash(key: string) {
    setActiveButton(key);
    setTimeout(() => setActiveButton(null), 2000);
  }

  const handleCopy = async () => {
    if (!recoveryKey) return;
    await clipboard.write({ "text/plain": recoveryKey });
    flash("copy");
  };

  const handleSaveToFile = async () => {
    if (!recoveryKey) return;
    const email = (await db.user.getUser())?.email || "user";
    const file = await files.create(`${email}-notesnook-recoverykey.txt`);
    await file.write(new TextEncoder().encode(recoveryKey));
    await file.close();
    flash("download");
  };

  const handleCopyQRCode = async () => {
    if (recoveryKey) await clipboard.write({ "text/plain": recoveryKey });
    flash("copyQR");
  };

  const handleDownloadQRCode = async () => {
    if (!qrRef.current) return;
    const email = (await db.user.getUser())?.email || "user";
    const png = await qrRef.current.toPNG();
    const file = await files.create(`${email}-notesnook-recoverykey.png`);
    await file.write(png);
    await file.close();
    flash("saveQR");
  };

  return (
    <Flex sx={{ flexDirection: "column", gap: "spacing4" }}>
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
            flexDirection: "row",
            gap: "spacing3"
          }}
        >
          <RecoveryKeyShieldCheck size={15} color="accent" />
          <Text sx={{ fontSize: "xs", fontWeight: 400, color: "accent" }}>
            {strings.saveYourRecoveryKey()}
          </Text>
        </Flex>
        <Flex
          sx={{
            bg: "background-tertiary",
            border: "1px dashed",
            borderColor: "accent",
            borderRadius: "radius2",
            p: "spacing4",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            width: "100%"
          }}
        >
          <ScrollContainer sx={{ flex: 1, minWidth: 0 }}>
            <Text
              selectable
              sx={{
                lineHeight: 1,
                color: "paragraph",
                fontWeight: 400,
                fontSize: "3xs"
              }}
            >
              {recoveryKey ? recoveryKey : strings.loading()}
            </Text>
          </ScrollContainer>
          <Flex
            onPress={handleCopy}
            sx={{
              alignItems: "center",
              flexDirection: "row",
              gap: "spacing3",
              flexShrink: 0,
              cursor: "pointer"
            }}
          >
            <Copy size={15} color="accent" />
            <Text sx={{ fontSize: "xs", fontWeight: 500, color: "accent" }}>
              {activeButton === "copy" ? strings.copied() : strings.copy()}
            </Text>
          </Flex>
        </Flex>
      </Flex>
      <Flex
        sx={{
          flexDirection: "column",
          gap: "spacing3",
          bg: "background-secondary",
          p: "spacing4",
          borderRadius: "radius2",
          width: "100%"
        }}
      >
        <Flex
          sx={{
            alignSelf: "center",
            bg: "background",
            border: "1px solid",
            borderColor: "border-secondary",
            p: 1
          }}
        >
          <QRCode
            ref={qrRef}
            value={recoveryKey || ""}
            size={150}
            ecLevel="M"
          />
        </Flex>
        <ActionButton
          icon={Copy}
          text={
            activeButton === "copyQR"
              ? strings.copied()
              : strings.copyToClipboard()
          }
          onPress={handleCopyQRCode}
        />
        <ActionButton
          icon={FloppyDisk}
          text={
            activeButton === "saveQR" ? strings.saved() : strings.saveQRImage()
          }
          onPress={handleDownloadQRCode}
        />
        <ActionButton
          icon={Download}
          text={
            activeButton === "download"
              ? strings.downloaded()
              : strings.downloadTextFile()
          }
          onPress={handleSaveToFile}
        />
      </Flex>
    </Flex>
  );
}
