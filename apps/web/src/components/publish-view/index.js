import React, { useEffect, useMemo, useState } from "react";
import ReactDOM from "react-dom";
import { Flex, Text, Button, Box } from "rebass";
import * as Icon from "../icons";
import Toggle from "../toggle";
import Field from "../field";
import { db } from "../../common/db";
import * as clipboard from "clipboard-polyfill/text";
import ThemeProvider from "../theme-provider";
import { showToast } from "../../utils/toast";
import { EV, EVENTS } from "@streetwriters/notesnook-core/common";
import { useStore } from "../../stores/monograph-store";
import { closeOpenedDialog } from "../../common/dialog-controller";

function PublishView(props) {
  const { noteId, position, onClose } = props;
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
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("click", onWindowClick);
    window.addEventListener("blur", onWindowClick);

    return () => {
      window.removeEventListener("click", onWindowClick);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("blur", onWindowClick);
    };
  }, []);

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
    <Flex
      sx={{
        position: "absolute",
        zIndex: 999,
        width: ["100%", 350, 350],
        border: "1px solid",
        borderColor: "border",
        borderRadius: "default",
        boxShadow: "0px 0px 15px 0px #00000011",
        ...position,
      }}
      bg="background"
      // p={2}
      flexDirection="column"
      onClick={(e) => {
        e.stopPropagation();
      }}
    >
      <Flex flexDirection={"column"} p={2}>
        <Text variant="body" fontSize="title" fontWeight="bold" color="primary">
          {noteTitle}
        </Text>
        {isPublishing ? (
          <Flex
            flexDirection="column"
            alignItems="center"
            my={50}
            justifyContent="center"
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
              <Flex mt={1} flexDirection="column" overflow="hidden">
                <Text variant="body" color="fontTertiary" fontWeight="bold">
                  Published at
                </Text>
                <Flex
                  sx={{
                    bg: "bgSecondary",
                    mt: 1,
                    p: 1,
                    borderRadius: "default",
                    alignItems: "center",
                    justifyContent: "center",
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
                      mr: 2,
                    }}
                  >
                    {`https://monograph.notesnook.com/${publishId}`}
                  </Text>
                  <Button
                    variant="anchor"
                    className="copyPublishLink"
                    onClick={() => {
                      clipboard.writeText(
                        `https://monograph.notesnook.com/${publishId}`
                      );
                    }}
                  >
                    <Icon.Copy size={20} color="primary" />
                  </Button>
                </Flex>
              </Flex>
            ) : (
              <>
                <Text variant="body" color="fontTertiary">
                  This note will be published to a public URL.
                </Text>
              </>
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
        alignItems="center"
        justifyContent={"end"}
        bg="bgSecondary"
        p={1}
        px={2}
      >
        <Button
          variant="primary"
          color="primary"
          fontWeight="bold"
          bg={"transparent"}
          sx={{
            ":hover": { bg: "bgSecondary" },
          }}
          onClick={async () => {
            try {
              setIsPublishing(true);
              const password =
                document.getElementById("publishPassword")?.value;

              const publishId = await publishNote(noteId, {
                selfDestruct,
                password,
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
        >
          {isPublishing ? (
            <>
              <Icon.Loading color="static" />
            </>
          ) : publishId ? (
            "Update"
          ) : (
            "Publish"
          )}
        </Button>
        {publishId && (
          <Button
            variant="primary"
            color="error"
            fontWeight="bold"
            bg={"transparent"}
            sx={{
              ":hover": { bg: "bgSecondary" },
            }}
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
          >
            Unpublish
          </Button>
        )}

        <Button
          variant="primary"
          data-test-id="dialog-no"
          color="text"
          fontWeight="bold"
          bg={"transparent"}
          sx={{
            ":hover": { bg: "bgSecondary" },
          }}
          onClick={() => {
            onClose(false);
          }}
        >
          Cancel
        </Button>
      </Flex>
    </Flex>
  );
}

export default PublishView;

export function showPublishView(noteId, location = "top") {
  const root = document.getElementById("dialogContainer");

  if (root) {
    return new Promise((resolve) => {
      const perform = (result) => {
        ReactDOM.unmountComponentAtNode(root);
        resolve(result);
      };
      ReactDOM.render(
        <ThemeProvider>
          <PublishView
            noteId={noteId}
            position={{
              top: location === "top" ? [0, 50, 60] : undefined,
              right: location === "top" ? [0, 20, 10] : undefined,
              bottom: location === "bottom" ? 0 : undefined,
              left: location === "bottom" ? 0 : undefined,
            }}
            onClose={perform}
          />
        </ThemeProvider>,
        root
      );
    });
  }
  return Promise.reject("No element with id 'dialogContainer'");
}

function onKeyDown(event) {
  if (event.keyCode === 27) closeOpenedDialog();
}

function onWindowClick() {
  closeOpenedDialog();
}
