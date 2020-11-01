import React, { useEffect, useState } from "react";
import { Text, Flex, Button } from "rebass";
import Dialog, { showDialog } from "./dialog";
import * as Icon from "../icons";
import { useStore as useUserStore } from "../../stores/user-store";
import { upgrade } from "../../common/upgrade";
import { showSignUpDialog } from "./signupdialog";
import { db } from "../../common";
import { QRCode } from "react-qrcode-logo";
import Logo from "../../assets/notesnook-small.png";
import download from "../../utils/download";
import copyToClipboard from "../../utils/clipboard";

function RecoveryKeyDialog(props) {
  const [key, setKey] = useState();
  const [username, setUsername] = useState();
  const [copyText, setCopyText] = useState("Copy to clipboard");
  useEffect(() => {
    (async () => {
      const { username, key, salt } = await db.user.get();
      setKey(key + "@" + salt);
      setUsername(username);
    })();
  }, []);
  return (
    <Dialog
      isOpen={true}
      title="Backup Recovery Key"
      onClose={props.onCancel}
      showClose
    >
      <Flex flexDirection="column" flex={1} sx={{ overflow: "hidden" }}>
        <Flex flexDirection="column" sx={{ overflowY: "auto" }}>
          <Text
            color="error"
            bg="errorBg"
            p={2}
            sx={{ borderRadius: "default" }}
            fontSize="subBody"
          >
            In case you forget your password, your recovery key is the only way
            to recover your data.
            <br />
            Please BACKUP your recovery key before proceeding
          </Text>
          <Text
            color="gray"
            bg="#dbdbdb22"
            p={2}
            sx={{ borderRadius: "default", overflowWrap: "anywhere" }}
          >
            {key}
          </Text>
          <Flex justifyContent="space-around" alignItems="center">
            <QRCode
              value={key}
              logoImage={Logo}
              logoWidth={25}
              ecLevel={"M"}
              logoHeight={25}
            />
            <Flex flexDirection="column">
              <Button
                mt={1}
                fontSize="body"
                onClick={async () => {
                  await copyToClipboard(key);
                  setCopyText("Copied!");
                  setTimeout(() => {
                    setCopyText("Copy to clipboard");
                  }, 2000);
                }}
              >
                {copyText}
              </Button>
              <Button
                mt={1}
                fontSize="body"
                onClick={async () => {
                  const qrcode = document.getElementById("react-qrcode-logo");
                  qrcode.toBlob((blob) => {
                    download(`${username}-notesnook-recoverykey`, blob, "png");
                  });
                }}
              >
                Download QR Code
              </Button>
              <Button
                mt={1}
                fontSize="body"
                onClick={() => {
                  download(`${username}-notesnook-recoverykey`, key, "txt");
                }}
              >
                Download file
              </Button>
            </Flex>
          </Flex>
        </Flex>
        <Flex flex={1} flexDirection="column" pt={2}>
          <Button mt={1} fontSize="body" onClick={props.onDone}>
            I have backed up my key
          </Button>
        </Flex>
      </Flex>
    </Dialog>
  );
}

export function showRecoveryKeyDialog() {
  return showDialog((perform) => (
    <RecoveryKeyDialog onDone={() => perform(true)} />
  ));
}
