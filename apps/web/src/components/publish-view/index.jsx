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

import { useEffect, useMemo, useState } from "react";
import ReactDOM from "react-dom";
import { Flex, Text, Button } from "@theme-ui/components";
import { Copy } from "../icons";
import Toggle from "../toggle";
import Field from "../field";
import { db } from "../../common/db";
import { writeText } from "clipboard-polyfill";
import { ScopedThemeProvider } from "../theme-provider";
import { showToast } from "../../utils/toast";
import { EV, EVENTS } from "@notesnook/core/common";
import { useStore } from "../../stores/monograph-store";
import ReactModal from "react-modal";
import { DialogButton } from "../dialog";

function PublishView(props) {
  const { noteId, onClose } = props;
  const [publishId, setPublishId] = useState();
  const [isPasswordProtected, setIsPasswordProtected] = useState(false);
  const [selfDestruct, setSelfDestruct] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState();
  const publishNote = useStore((store) => store.publish);
  const unpublishNote = useStore((store) => store.unpublish);

  const noteTitle = useMemo(() => db.notes.note(noteId)?.title, [noteId]);

  useEffect(() => {
    setPublishId(db.monographs.monograph(noteId));
  }, [noteId]);

  useEffect(() => {
    const attachmentsLoadingEvent = EV.subscribe(
      EVENTS.attachmentsLoading,
      ({ type, groupId, total, current }) => {
        if (!groupId || !groupId.includes(noteId) || type !== "download")
          return;
        if (current === total) setProcessingStatus();
        else setProcessingStatus({ total, current });
      }
    );
    return () => {
      attachmentsLoadingEvent.unsubscribe();
    };
  }, [noteId]);

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
          {noteTitle}
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
            <Text>Please wait...</Text>
            {processingStatus && (
              <Text variant="subBody" mt={1}>
                Downloading images ({processingStatus.current}/
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
                  Published at
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
                  <Text
                    variant="body"
                    as="a"
                    target="_blank"
                    href={`https://monograph.notesnook.com/${publishId}`}
                    sx={{
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      textDecoration: "none",
                      overflow: "hidden",
                      mr: 2
                    }}
                  >
                    {`https://monograph.notesnook.com/${publishId}`}
                  </Text>
                  <Button
                    variant="anchor"
                    className="copyPublishLink"
                    onClick={() => {
                      writeText(`https://monograph.notesnook.com/${publishId}`);
                    }}
                  >
                    <Copy size={20} color="accent" />
                  </Button>
                </Flex>
              </Flex>
            ) : (
              <Text variant="body" sx={{ color: "paragraph" }}>
                This note will be published to a public URL.
              </Text>
            )}
            <Toggle
              title="Self destruct?"
              onTip="Note will be automatically unpublished after first view."
              offTip="Note will stay published until manually unpublished."
              isToggled={selfDestruct}
              onToggled={() => setSelfDestruct((s) => !s)}
            />
            <Toggle
              title="Password protect?"
              onTip="Protect published note with a password."
              offTip="Do not protect published note with a password."
              isToggled={isPasswordProtected}
              onToggled={() => setIsPasswordProtected((s) => !s)}
            />
            {isPasswordProtected && (
              <Field
                autoFocus
                id="publishPassword"
                placeholder="Enter password to encrypt this note"
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
              const password =
                document.getElementById("publishPassword")?.value;

              const publishId = await publishNote(noteId, {
                selfDestruct,
                password
              });
              setPublishId(publishId);
              showToast("success", "Note published.");
            } catch (e) {
              console.error(e);
              showToast("error", "Note could not be published: " + e.message);
            } finally {
              setIsPublishing(false);
            }
          }}
          loading={isPublishing}
          text={publishId ? "Update" : "Publish"}
        />
        {publishId && (
          <DialogButton
            color="red"
            onClick={async () => {
              try {
                setIsPublishing(true);
                await unpublishNote(noteId);
                setPublishId();
                onClose(true);
                showToast("success", "Note unpublished.");
              } catch (e) {
                console.error(e);
                showToast(
                  "error",
                  "Note could not be unpublished: " + e.message
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

export function showPublishView(noteId, location = "top") {
  const root = document.getElementById("dialogContainer");

  if (root) {
    return new Promise((resolve) => {
      const perform = (result) => {
        ReactDOM.unmountComponentAtNode(root);
        closePublishView();
        resolve(result);
      };
      ReactDOM.render(
        <ReactModal
          isOpen
          onRequestClose={perform}
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
          <PublishView noteId={noteId} onClose={perform} />
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
