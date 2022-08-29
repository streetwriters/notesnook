import React, { useCallback, useEffect, useState } from "react";
import * as Icon from "../icons";
import { Flex, Text } from "@streetwriters/rebass";
import { useStore, store } from "../../stores/editor-store";
import { COLORS } from "../../common/constants";
import { db } from "../../common/db";
import { useStore as useAppStore } from "../../stores/app-store";
import { useStore as useAttachmentStore } from "../../stores/attachment-store";
import { store as noteStore } from "../../stores/note-store";
import { AnimatedFlex } from "../animated";
import Toggle from "./toggle";
import { navigate } from "../../navigation";
import IconTag from "../icon-tag";
import ScrollContainer from "../scroll-container";
import { formatDate } from "@streetwriters/notesnook-core/utils/date";
import Vault from "../../common/vault";
import TimeAgo from "../time-ago";
import Attachment from "../attachment";
import { formatBytes } from "../../utils/filename";
import { getTotalSize } from "../../common/attachments";

const tools = [
  { key: "pinned", icon: Icon.Pin, label: "Pin" },
  {
    key: "favorite",
    icon: Icon.StarOutline,
    label: "Favorite"
  },
  { key: "locked", icon: Icon.Unlock, label: "Lock" },
  { key: "readonly", icon: Icon.Readonly, label: "Readonly" },
  { key: "localOnly", icon: Icon.SyncOff, label: "Disable sync" }
];

const metadataItems = [
  {
    key: "dateCreated",
    label: "Created at",
    value: (date) => formatDate(date || Date.now())
  },
  {
    key: "dateEdited",
    label: "Last edited at",
    value: (date) => (date ? formatDate(date) : "never")
  }
];

function Properties(props) {
  const { onOpenPreviewSession } = props;

  const [versionHistory, setVersionHistory] = useState([]);

  const toggleProperties = useStore((store) => store.toggleProperties);
  const isFocusMode = useAppStore((store) => store.isFocusMode);
  const session = useStore((store) => store.session);
  const attachments = useAttachmentStore((store) =>
    store.attachments.filter((a) => a.noteIds.includes(session.id))
  );
  const { id: sessionId, color, notebooks, sessionType, dateCreated } = session;
  const isPreviewMode = sessionType === "preview";

  const changeState = useCallback(
    function changeState(prop, value) {
      switch (prop) {
        case "locked":
          return store.get().session.locked
            ? noteStore.unlock(sessionId)
            : noteStore.lock(sessionId);
        case "readonly":
          return noteStore.readonly(sessionId);
        case "localOnly":
          return noteStore.localOnly(sessionId);
        case "pinned":
          return noteStore.pin(sessionId);
        case "favorite":
          return noteStore.favorite(sessionId);
        default:
          return;
      }
    },
    [sessionId]
  );

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
          x: 0
        }}
        transition={{
          duration: 0.3,
          bounceDamping: 1,
          bounceStiffness: 1,
          ease: "easeOut"
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
          overflowX: "hidden"
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
            {!isPreviewMode && (
              <>
                {tools.map((tool) => (
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
                  borderBottom: "1px solid var(--border)"
                }}
              >
                <Text variant="body" color="fontTertiary">
                  {item.label}
                </Text>
                <Text
                  className="selectable"
                  variant="body"
                  color="fontTertiary"
                >
                  {item.value(session[item.key])}
                </Text>
              </Flex>
            ))}
            {!isPreviewMode && (
              <>
                <Flex
                  py={2}
                  px={2}
                  sx={{
                    cursor: "pointer"
                  }}
                  justifyContent="center"
                >
                  {COLORS.map((label) => (
                    <Flex
                      key={label}
                      justifyContent="space-between"
                      alignItems="center"
                      onClick={() => noteStore.get().setColor(sessionId, label)}
                      sx={{
                        cursor: "pointer",
                        position: "relative"
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
          {notebooks?.length > 0 && (
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
                        bg: "hover"
                      }
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
                        flexWrap: "wrap"
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
          {attachments?.length > 0 && (
            <Card
              title="Attachments"
              subtitle={`${attachments.length} attachments | ${formatBytes(
                getTotalSize(attachments)
              )} occupied`}
            >
              {attachments.map((attachment, i) => (
                <Attachment
                  key={attachment.id}
                  item={attachment}
                  index={i}
                  isCompact
                />
              ))}
            </Card>
          )}
          <Card
            title="Previous Sessions"
            subtitle={"Your session history is local only."}
          >
            {versionHistory.map((session, index) => {
              const fromDate = formatDate(session.dateCreated, {
                dateStyle: "short"
              });
              const toDate = formatDate(session.dateModified, {
                dateStyle: "short"
              });
              const fromTime = formatDate(session.dateCreated, {
                timeStyle: "short"
              });
              const toTime = formatDate(session.dateModified, {
                timeStyle: "short"
              });
              const label = `${fromDate}, ${fromTime} — ${
                fromDate !== toDate ? `${toDate}, ` : ""
              }${toTime}`;
              const isSelected =
                isPreviewMode && session.dateCreated === dateCreated;

              return (
                <Flex
                  key={session.id}
                  data-test-id={`session-${index}`}
                  py={1}
                  px={2}
                  sx={{
                    cursor: "pointer",
                    bg: isSelected ? "bgSecondary" : "transparent",
                    ":hover": {
                      bg: "hover"
                    }
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
                          onOpenPreviewSession({
                            content: decryptedContent,
                            dateCreated: session.dateCreated,
                            dateEdited: session.dateModified
                          });
                          return true;
                        } catch (e) {
                          return false;
                        }
                      });
                    } else {
                      onOpenPreviewSession({
                        content,
                        dateCreated: session.dateCreated,
                        dateEdited: session.dateModified
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
        borderRadius: "default"
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
