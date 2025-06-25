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

import { useEffect, useRef, useState } from "react";
import ReactDOM from "react-dom";
import { Flex, Text, Button, Link } from "@theme-ui/components";
import { Copy } from "../icons";
import Toggle from "../toggle";
import Field from "../field";
import { db } from "../../common/db";
import { writeText } from "clipboard-polyfill";
import { ScopedThemeProvider } from "../theme-provider";
import { showToast } from "../../utils/toast";
import { EV, EVENTS, hosts } from "@notesnook/core";
import { useStore } from "../../stores/monograph-store";
import ReactModal from "react-modal";
import { DialogButton } from "../dialog";
import { Note } from "@notesnook/core";
import { strings } from "@notesnook/intl";

type PublishViewProps = {
  note: Note;
  onClose: (result: boolean) => void;
};
function PublishView(props: PublishViewProps) {
  const { note, onClose } = props;
  const [publishId, setPublishId] = useState<string | undefined>(
    db.monographs.monograph(note.id)
  );
  const [isPasswordProtected, setIsPasswordProtected] = useState(false);
  const [selfDestruct, setSelfDestruct] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState<{
    total?: number;
    current: number;
  }>();
  const passwordInput = useRef<HTMLInputElement>(null);
  const publishNote = useStore((store) => store.publish);
  const unpublishNote = useStore((store) => store.unpublish);

  useEffect(() => {
    const fileDownloadedEvent = EV.subscribe(
      EVENTS.fileDownloaded,
      ({ total, current, groupId }) => {
        if (!groupId || !groupId.includes(note.id)) return;
        if (current === total) setProcessingStatus(undefined);
        else setProcessingStatus({ total, current });
      }
    );

    return () => {
      fileDownloadedEvent.unsubscribe();
    };
  }, [note.id]);

  return (
    <ScopedThemeProvider
      scope="dialog"
      injectCssVars
      sx={{
        width: ["100%", 350, 350],
        border: "1px solid",
        borderColor: "border",
        borderRadius: "dialog",
        flexDirection: "column",
        overflow: "hidden"
      }}
      bg="background"
    >
      <Flex p={2} sx={{ flexDirection: "column" }}>
        <Text
          variant="body"
          sx={{ fontSize: "title", fontWeight: "bold", color: "accent" }}
        >
          {note.title}
        </Text>
        {isPublishing ? (
          <Flex
            my={50}
            sx={{
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center"
            }}
          >
            <Text>{strings.pleaseWait()}...</Text>
            {processingStatus && (
              <Text variant="subBody" mt={1}>
                {strings.downloadingImages()} ({processingStatus.current}/
                {processingStatus.total})
              </Text>
            )}
          </Flex>
        ) : (
          <>
            {publishId ? (
              <Flex mt={1} sx={{ flexDirection: "column", overflow: "hidden" }}>
                <Text
                  variant="body"
                  sx={{ fontWeight: "bold", color: "paragraph" }}
                >
                  {strings.publishedAt()}
                </Text>
                <Flex
                  sx={{
                    bg: "var(--background-secondary)",
                    mt: 1,
                    p: 1,
                    borderRadius: "default",
                    alignItems: "center",
                    justifyContent: "center"
                  }}
                >
                  <Link
                    variant="text.body"
                    as="a"
                    target="_blank"
                    href={`${hosts.MONOGRAPH_HOST}/${publishId}`}
                    sx={{
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      textDecoration: "none",
                      overflow: "hidden",
                      mr: 2
                    }}
                  >
                    {`${hosts.MONOGRAPH_HOST}/${publishId}`}
                  </Link>
                  <Button
                    variant="anchor"
                    className="copyPublishLink"
                    onClick={() => {
                      writeText(`${hosts.MONOGRAPH_HOST}/${publishId}`);
                    }}
                  >
                    <Copy size={20} color="accent" />
                  </Button>
                </Flex>
              </Flex>
            ) : (
              <Text variant="body" sx={{ color: "paragraph" }}>
                {strings.monographDesc()}
              </Text>
            )}
            <Toggle
              title={strings.monographSelfDestructHeading()}
              tip={strings.monographSelfDestructDesc()}
              isToggled={selfDestruct}
              onToggled={() => setSelfDestruct((s) => !s)}
            />
            <Toggle
              title={strings.monographPassHeading()}
              tip={strings.monographPassDesc()}
              isToggled={isPasswordProtected}
              onToggled={() => setIsPasswordProtected((s) => !s)}
            />
            {isPasswordProtected && (
              <Field
                inputRef={passwordInput}
                autoFocus
                type="password"
                id="publishPassword"
                placeholder={strings.enterPassword()}
                required
                sx={{ my: 1 }}
              />
            )}
          </>
        )}
      </Flex>

      <Flex
        bg="var(--background-secondary)"
        p={1}
        px={2}
        sx={{ alignItems: "center", justifyContent: "end" }}
      >
        <DialogButton
          color="accent"
          onClick={async () => {
            try {
              setIsPublishing(true);
              const password = passwordInput.current?.value;

              const publishId = await publishNote(note.id, {
                selfDestruct,
                password
              });
              setPublishId(publishId);
              showToast("success", strings.actions.published.note(1));
            } catch (e) {
              console.error(e);
              showToast(
                "error",
                `${strings.actionErrors.published.note(1)}: ${
                  (e as Error).message
                }`
              );
            } finally {
              setIsPublishing(false);
            }
          }}
          loading={isPublishing}
          text={publishId ? strings.update() : strings.publish()}
        />
        {publishId && (
          <DialogButton
            color="red"
            onClick={async () => {
              try {
                setIsPublishing(true);
                await unpublishNote(note.id);
                setPublishId(undefined);
                onClose(true);
                showToast("success", strings.actions.unpublished.note(1));
              } catch (e) {
                console.error(e);
                showToast(
                  "error",
                  `${strings.actionErrors.unpublished.note(1)}: ` +
                    (e as Error).message
                );
              } finally {
                setIsPublishing(false);
              }
            }}
            text={"Unpublish"}
          />
        )}

        <DialogButton
          data-test-id="dialog-no"
          onClick={() => {
            onClose(false);
          }}
          color="paragraph"
          text="Cancel"
        />
      </Flex>
    </ScopedThemeProvider>
  );
}

export default PublishView;

export function showPublishView(note: Note, location = "top") {
  const root = document.getElementById("dialogContainer");

  if (root) {
    return new Promise((resolve) => {
      const perform = (result: boolean) => {
        ReactDOM.unmountComponentAtNode(root);
        closePublishView();
        resolve(result);
      };
      ReactDOM.render(
        <ReactModal
          isOpen
          onRequestClose={() => perform(false)}
          preventScroll={false}
          shouldCloseOnOverlayClick
          shouldCloseOnEsc
          shouldFocusAfterRender
          shouldReturnFocusAfterClose
          style={{
            overlay: { backgroundColor: "transparent", zIndex: 999 },
            content: {
              padding: 0,
              top: location === "top" ? 60 : undefined,
              right: location === "top" ? 10 : undefined,
              bottom: location === "bottom" ? 0 : undefined,
              left: location === "bottom" ? 0 : undefined,
              background: "transparent",
              border: "none",
              borderRadius: 0,
              boxShadow: "0px 0px 15px 0px #00000011"
            }
          }}
        >
          <PublishView note={note} onClose={perform} />
        </ReactModal>,
        root
      );
    });
  }
  return Promise.reject("No element with id 'dialogContainer'");
}

function closePublishView() {
  const root = document.getElementById("dialogContainer");
  if (root) {
    root.innerHTML = "";
  }
}
