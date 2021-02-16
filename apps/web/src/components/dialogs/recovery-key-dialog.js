import React, { useEffect, useState } from "react";
import { Text, Flex, Button } from "rebass";
import Dialog from "./dialog";
import { db } from "../../common";
import Logo from "../../assets/notesnook-small.png";
import download from "../../utils/download";
import ClipboardJS from "clipboard";
import { captureMessage } from "@sentry/react";
import { useStore as useUserStore } from "../../stores/user-store";
import { Suspense } from "react";

const QRCode = React.lazy(() => import("../../re-exports/react-qrcode-logo"));

function RecoveryKeyDialog(props) {
  const [key, setKey] = useState();
  const { email } = useUserStore((store) => store.user);
  const [copyText, setCopyText] = useState("Copy to clipboard");
  useEffect(() => {
    (async () => {
      const { key } = await db.user.getEncryptionKey();
      setKey(key);
    })();
  }, []);

  useEffect(() => {
    var clipboard = new ClipboardJS(".copyKey");
    clipboard.on("success", function (e) {
      setCopyText("Copied!");
      setTimeout(() => {
        setCopyText("Copy to clipboard");
      }, 2000);
      e.clearSelection();
    });
    clipboard.on("error", function () {
      captureMessage("Error while copying text.");
    });
    return () => {
      clipboard?.destroy();
    };
  }, []);

  return (
    <Dialog isOpen={true} title="Backup Recovery Key">
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
            mt={2}
            bg="bgSecondary"
            p={2}
            fontFamily="monospace"
            fontSize="body"
            sx={{ borderRadius: "default", overflowWrap: "anywhere" }}
          >
            {key}
          </Text>
          <Flex justifyContent="space-around" alignItems="center">
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
                data-clipboard-text={key}
                mt={1}
                className="copyKey"
                fontSize="body"
                onClick={async () => {
                  // await copyToClipboard(key);
                  // setCopyText("Copied!");
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
                    download(`${email}-notesnook-recoverykey`, blob, "png");
                  });
                }}
              >
                Download QR Code
              </Button>
              <Button
                mt={1}
                fontSize="body"
                onClick={() => {
                  download(`${email}-notesnook-recoverykey`, key, "txt");
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
export default RecoveryKeyDialog;
