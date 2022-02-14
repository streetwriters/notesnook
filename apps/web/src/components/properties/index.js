import React, { useCallback, useEffect, useState } from "react";
import * as Icon from "../icons";
import { Flex, Text, Button, Box } from "rebass";
import { useStore } from "../../stores/editor-store";
import { COLORS } from "../../common";
import { AppEventManager, AppEvents } from "../../common/app-events";
import { db } from "../../common/db";
import { useStore as useAppStore } from "../../stores/app-store";
import { AnimatedFlex } from "../animated";
import Toggle from "./toggle";
import { navigate } from "../../navigation";
import IconTag from "../icon-tag";
import { formatBytes, truncateFilename } from "../../utils/filename";
import ScrollContainer from "../scroll-container";
import { downloadAttachment } from "../../common/attachments";
import { formatDate } from "notes-core/utils/date";
import Vault from "../../common/vault";
import TimeAgo from "../time-ago";

const tools = [
  { key: "pinned", icon: Icon.Pin, label: "Pin" },
  {
    key: "favorite",
    icon: Icon.StarOutline,
    label: "Favorite",
  },
  { key: "locked", icon: Icon.Unlock, label: "Lock" },
];

const metadataItems = [
  {
    key: "dateCreated",
    label: "Created at",
    value: (date) => formatDate(date || Date.now()),
  },
  {
    key: "dateEdited",
    label: "Last edited at",
    value: (date) => (date ? formatDate(date) : "never"),
  },
];

function Properties() {
  const [attachmentsStatus, setAttachmentsStatus] = useState({});
  const [versionHistory, setVersionHistory] = useState([]);

  const toggleLocked = useStore((store) => store.toggleLocked);
  const setSession = useStore((store) => store.setSession);
  const openPreviewSession = useStore((store) => store.openPreviewSession);
  const setColor = useStore((store) => store.setColor);
  const toggleProperties = useStore((store) => store.toggleProperties);
  const isFocusMode = useAppStore((store) => store.isFocusMode);

  const session = useStore((store) => store.session);
  const {
    id: sessionId,
    color,
    notebooks,
    attachments,
    readonly: isReadonly,
  } = session;

  const changeState = useCallback(
    function changeState(prop, value) {
      if (prop === "locked") {
        toggleLocked();
        return;
      }
      setSession((state) => {
        state.session[prop] = value;
      });
    },
    [setSession, toggleLocked]
  );

  useEffect(() => {
    const event = AppEventManager.subscribe(
      AppEvents.UPDATE_ATTACHMENT_PROGRESS,
      ({ hash, type, total, loaded }) => {
        if (!attachments.find((a) => a.metadata.hash === hash)) return;
        const percent = Math.round((loaded / total) * 100);
        setAttachmentsStatus((status) => {
          const copy = { ...status };
          copy[hash] =
            percent >= 100
              ? null
              : {
                  type,
                  loaded,
                  progress: percent,
                };
          return copy;
        });
      }
    );
    return () => {
      event.unsubscribe();
    };
  }, [attachments]);

  useEffect(() => {
    if (!sessionId) return;

    (async () => {
      const history = await db.noteHistory.get(sessionId);
      setVersionHistory(history);
    })();
  }, [sessionId]);

  if (isFocusMode || !sessionId) return null;
  return (
    <>
      <AnimatedFlex
        animate={{
          x: 0,
        }}
        transition={{
          duration: 0.3,
          bounceDamping: 1,
          bounceStiffness: 1,
          ease: "easeOut",
        }}
        initial={{ x: 800 }}
        sx={{
          display: "flex",
          position: "absolute",
          right: 0,
          zIndex: 3,
          height: "100%",
          width: "300px",
          borderLeft: "1px solid",
          borderLeftColor: "border",
          overflowY: "hidden",
          overflowX: "hidden",
        }}
        flexDirection="column"
        bg="background"
        // px={2}
      >
        <ScrollContainer>
          <Card
            title="Properties"
            button={
              <Icon.ArrowLeft
                data-test-id="properties-close"
                onClick={() => toggleProperties(false)}
                size={18}
                sx={{ mr: 1 }}
              />
            }
          >
            {!isReadonly && (
              <>
                {tools.map((tool, _) => (
                  <Toggle
                    {...tool}
                    key={tool.key}
                    toggleKey={tool.key}
                    onToggle={(state) => changeState(tool.key, state)}
                    testId={`properties-${tool.key}`}
                  />
                ))}
              </>
            )}
            {metadataItems.map((item) => (
              <Flex
                key={item.key}
                alignItems="center"
                justifyContent="space-between"
                py={2}
                px={2}
                sx={{
                  borderBottom: "1px solid var(--border)",
                }}
              >
                <Text variant="body" color="fontTertiary">
                  {item.label}
                </Text>
                <Text variant="body" color="fontTertiary">
                  {item.value(session[item.key])}
                </Text>
              </Flex>
            ))}
            {!isReadonly && (
              <>
                <Flex
                  py={2}
                  px={2}
                  sx={{
                    cursor: "pointer",
                  }}
                  justifyContent="center"
                >
                  {COLORS.map((label) => (
                    <Flex
                      key={label}
                      justifyContent="space-between"
                      alignItems="center"
                      onClick={() => setColor(label)}
                      sx={{
                        cursor: "pointer",
                        position: "relative",
                      }}
                      data-test-id={`properties-${label}`}
                    >
                      <Icon.Circle size={35} color={label.toLowerCase()} />
                      {label.toLowerCase() === color?.toLowerCase() && (
                        <Icon.Checkmark
                          color="static"
                          size={18}
                          sx={{ position: "absolute", left: "8px" }}
                          data-test-id={`properties-${label}-check`}
                        />
                      )}
                    </Flex>
                  ))}
                </Flex>
              </>
            )}
          </Card>
          {!!notebooks?.length && (
            <Card title="Referenced In">
              {notebooks.map((ref) => {
                const notebook = db.notebooks.notebook(ref.id);
                if (!notebook) return null;
                const topics = ref.topics.reduce((topics, topicId) => {
                  const topic = notebook.topics.topic(topicId);
                  if (!!topic && !!topic._topic) topics.push(topic._topic);
                  return topics;
                }, []);

                return (
                  <Flex
                    key={notebook.id}
                    py={1}
                    px={2}
                    sx={{
                      borderBottom: "1px solid var(--border)",
                      ":last-of-type": { borderBottom: "none" },
                      cursor: "pointer",
                      ":hover": {
                        bg: "hover",
                      },
                    }}
                    flexDirection="column"
                    onClick={() => {
                      navigate(`/notebooks/${notebook.data.id}`);
                    }}
                  >
                    <Text variant="body" display="flex" alignItems="center">
                      <Icon.Notebook size={13} sx={{ flexShrink: 0, mr: 1 }} />
                      {notebook.title}
                    </Text>

                    <Flex
                      sx={{
                        flexWrap: "wrap",
                      }}
                      mt={1}
                    >
                      {topics.map((topic) => (
                        <IconTag
                          title={topic.title}
                          text={topic.title}
                          key={topic.id}
                          icon={Icon.Topic}
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(
                              `/notebooks/${notebook.data.id}/${topic.id}`
                            );
                          }}
                        />
                      ))}
                    </Flex>
                  </Flex>
                );
              })}
            </Card>
          )}
          {attachments.length > 0 && (
            <Card
              title="Attachments"
              subtitle={`${attachments.length} attachments`}
            >
              {attachments.map((attachment) => {
                const attachmentStatus =
                  attachmentsStatus[attachment.metadata.hash];
                return (
                  <Flex
                    key={attachment.id}
                    py={1}
                    px={2}
                    sx={{
                      borderBottom: "1px solid var(--border)",
                      ":last-of-type": { borderBottom: "none" },
                      ":hover .attachment-download-btn": {
                        opacity: 1,
                      },
                    }}
                    title={attachment.metadata.filename}
                    alignItems="center"
                    justifyContent="space-between"
                  >
                    <Flex flexDirection="column" flex={1}>
                      <Text
                        variant="body"
                        fontSize="subtitle"
                        sx={{
                          whiteSpace: "nowrap",
                          textOverflow: "ellipsis",
                          overflow: "hidden",
                        }}
                      >
                        {truncateFilename(attachment.metadata.filename)}
                      </Text>
                      {attachmentStatus && (
                        <Box
                          sx={{
                            my: 1,
                            bg: "primary",
                            height: "2px",
                            width: `${attachmentStatus.progress}%`,
                          }}
                        />
                      )}
                      <Flex mt={1}>
                        {attachmentStatus ? (
                          <Text variant="subBody">
                            {formatBytes(attachmentStatus.loaded, 1)} of{" "}
                            {formatBytes(attachment.length, 1)} (
                            {attachmentStatus.type}ing)
                          </Text>
                        ) : (
                          <Text variant="subBody">
                            {formatBytes(attachment.length, 1)}
                          </Text>
                        )}
                      </Flex>
                    </Flex>

                    <Box>
                      {attachmentStatus ? (
                        <Button
                          title="Cancel download"
                          variant="tool"
                          p={1}
                          m={1}
                          sx={{ ":hover": { bg: "hover" } }}
                          onClick={async () => {
                            await db.fs.cancel(
                              attachment.metadata.hash,
                              "download"
                            );
                          }}
                        >
                          <Icon.Close size={16} />
                        </Button>
                      ) : (
                        <Button
                          className="attachment-download-btn"
                          title="Download attachment"
                          variant="tool"
                          p={1}
                          m={1}
                          sx={{ ":hover": { bg: "hover" }, opacity: 0 }}
                          onClick={async () => {
                            await downloadAttachment(attachment.metadata.hash);
                          }}
                        >
                          <Icon.Download size={16} />
                        </Button>
                      )}
                    </Box>
                  </Flex>
                );
              })}
            </Card>
          )}
          <Card
            title="Previous Sessions"
            subtitle={"Your session history is local only."}
          >
            {versionHistory.map((session, index) => {
              const fromDate = formatDate(session.dateCreated, {
                dateStyle: "short",
              });
              const toDate = formatDate(session.dateModified, {
                dateStyle: "short",
              });
              const fromTime = formatDate(session.dateCreated, {
                timeStyle: "short",
              });
              const toTime = formatDate(session.dateModified, {
                timeStyle: "short",
              });
              const label = `${fromDate}, ${fromTime} — ${
                fromDate !== toDate ? `${toDate}, ` : ""
              }${toTime}`;

              return (
                <Flex
                  data-test-id={`session-${index}`}
                  py={1}
                  px={2}
                  sx={{
                    cursor: "pointer",
                    ":hover": {
                      bg: "hover",
                    },
                  }}
                  justifyContent={"space-between"}
                  alignItems={"center"}
                  title="Click to preview"
                  onClick={async () => {
                    toggleProperties(false);
                    const content = await db.noteHistory.content(session.id);

                    if (session.locked) {
                      await Vault.askPassword(async (password) => {
                        try {
                          const decryptedContent =
                            await db.vault.decryptContent(content, password);
                          openPreviewSession({
                            content: decryptedContent,
                            dateCreated: session.dateCreated,
                            dateEdited: session.dateModified,
                          });
                          return true;
                        } catch (e) {
                          return false;
                        }
                      });
                    } else {
                      openPreviewSession({
                        content,
                        dateCreated: session.dateCreated,
                        dateEdited: session.dateModified,
                      });
                    }
                  }}
                >
                  <Text variant={"body"}>{label}</Text>
                  <Flex sx={{ fontSize: "subBody", color: "fontTertiary" }}>
                    {session.locked && <Icon.Lock size={14} />}
                    <TimeAgo
                      live
                      datetime={session.dateModified}
                      locale={"en_short"}
                    />
                  </Flex>
                </Flex>
              );
            })}
          </Card>
        </ScrollContainer>
      </AnimatedFlex>
    </>
  );
}
export default React.memo(Properties);

function Card({ title, subtitle, button, children }) {
  return (
    <Flex
      flexDirection="column"
      sx={{
        borderRadius: "default",
      }}
    >
      <Flex mx={2} mt={2} alignItems="center">
        {button}
        <Text variant="subtitle">{title}</Text>
      </Flex>
      {subtitle && (
        <Text variant="subBody" mb={1} mx={2}>
          {subtitle}
        </Text>
      )}
      {children}
    </Flex>
  );
}
