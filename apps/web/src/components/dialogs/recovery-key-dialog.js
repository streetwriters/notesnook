import React, { useEffect, useState } from "react";
import { Text, Flex, Button } from "@streetwriters/rebass";
import Dialog from "./dialog";
import { db } from "../../common/db";
import Logo from "../../assets/notesnook-logo.png";
import * as clipboard from "clipboard-polyfill/text";
import { Suspense } from "react";
import Config from "../../utils/config";
import FileSaver from "file-saver";

const QRCode = React.lazy(() => import("../../re-exports/react-qrcode-logo"));

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
          </Text>
          <Text
            data-test-id="recoveryKey"
            className="selectable"
            mt={2}
            bg="bgSecondary"
            p={2}
            fontFamily="monospace"
            fontSize="body"
            color="text"
            sx={{ borderRadius: "default", overflowWrap: "anywhere" }}
          >
            {key}
          </Text>
          <Flex justifyContent="space-around" alignItems="center" mt={4}>
            <Suspense fallback={<div />}>
              <QRCode
                value={key}
                logoImage={Logo}
                logoWidth={25}
                ecLevel={"M"}
                logoHeight={25}
              />
            </Suspense>

            <Flex flexDirection="column">
              <Button
                variant="secondary"
                mt={1}
                className="copyKey"
                fontSize="body"
                onClick={async () => {
                  clipboard
                    .writeText(key)
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
              >
                {copyText}
              </Button>
              <Button
                variant="secondary"
                mt={1}
                fontSize="body"
                onClick={async () => {
                  const qrcode = document.getElementById("react-qrcode-logo");
                  qrcode.toBlob((blob) => {
                    FileSaver.saveAs(
                      blob,
                      `${email}-notesnook-recoverykey.png`
                    );
                  });
                }}
              >
                Download QR Code
              </Button>
              <Button
                variant="secondary"
                mt={1}
                fontSize="body"
                onClick={() => {
                  FileSaver.saveAs(
                    new Blob([Buffer.from(key)]),
                    `${email}-notesnook-recoverykey.txt`
                  );
                }}
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
