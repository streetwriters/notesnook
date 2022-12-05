/*
This file is part of the Notesnook project (https://notesnook.com/)

Copyright (C) 2022 Streetwriters (Private) Limited

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

import React, { forwardRef, useCallback, useEffect, useState } from "react";
import * as Icon from "../icons";
import { Flex, Text, Input } from "@theme-ui/components";
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
import { formatDate } from "@notesnook/core/utils/date";
import Vault from "../../common/vault";
import TimeAgo from "../time-ago";
import Attachment from "../attachment";
import { formatBytes } from "../../utils/filename";
import { getTotalSize } from "../../common/attachments";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const tools = [
  { key: "pin", property: "pinned", icon: Icon.Pin, label: "Pin" },
  {
    key: "favorite",
    property: "favorite",
    icon: Icon.StarOutline,
    label: "Favorite"
  },
  { key: "lock", icon: Icon.Unlock, label: "Lock", property: "locked" },
  {
    key: "readonly",
    icon: Icon.Readonly,
    label: "Readonly",
    property: "readonly"
  },
  {
    key: "local-only",
    icon: Icon.SyncOff,
    label: "Disable sync",
    property: "localOnly"
  }
];

const metadataItems = [
  {
    key: "dateCreated",
    label: "Created at",
    value: (date) => date || Date.now()
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
  const [startDate, setStartDate] = useState();

  const toggleProperties = useStore((store) => store.toggleProperties);
  const isFocusMode = useAppStore((store) => store.isFocusMode);
  const session = useStore((store) => store.session);
  const attachments = useAttachmentStore((store) =>
    store.attachments.filter((a) => a.noteIds.includes(session.id))
  );
  const { id: sessionId, color, notebooks, sessionType, dateCreated } = session;
  const isPreviewMode = sessionType === "preview";

  const changeState = useCallback(
    function changeState(prop) {
      switch (prop) {
        case "lock":
          return store.get().session.locked
            ? noteStore.unlock(sessionId)
            : noteStore.lock(sessionId);
        case "readonly":
          return noteStore.readonly(sessionId);
        case "local-only":
          return noteStore.localOnly(sessionId);
        case "pin":
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
          overflowX: "hidden",
          flexDirection: "column"
        }}
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
                    toggleKey={tool.property}
                    onToggle={(state) => changeState(tool.key, state)}
                    testId={`properties-${tool.key}`}
                  />
                ))}
              </>
            )}
            {metadataItems.map((item) => (
              <Flex
                key={item.key}
                py={2}
                px={2}
                sx={{
                  borderBottom: "1px solid var(--border)",
                  alignItems: "center",
                  justifyContent: "space-between"
                }}
              >
                <Text
                  variant="body"
                  sx={{ color: "fontTertiary", whiteSpace: "nowrap" }}
                >
                  {item.label}
                </Text>
                {item.key === "dateCreated" ? (
                  <DatePicker
                    customInput={<CustomInput />}
                    showMonthDropdown
                    showYearDropdown
                    selected={startDate || item.value(session[item.key])}
                    onChange={(date) => setStartDate(date)}
                    dropdownMode="select"
                    timeInputLabel="Time:"
                    dateFormat="MMM d, yyyy, h:mm aa"
                    showTimeInput
                  ></DatePicker>
                ) : (
                  <Text
                    className="selectable"
                    variant="body"
                    sx={{ color: "fontTertiary" }}
                  >
                    {item.value(session[item.key])}
                  </Text>
                )}
              </Flex>
            ))}
            {!isPreviewMode && (
              <>
                <Flex
                  py={2}
                  px={2}
                  sx={{
                    cursor: "pointer",
                    justifyContent: "center"
                  }}
                >
                  {COLORS.map((label) => (
                    <Flex
                      key={label}
                      onClick={() => noteStore.get().setColor(sessionId, label)}
                      sx={{
                        cursor: "pointer",
                        position: "relative",
                        alignItems: "center",
                        justifyContent: "space-between"
                      }}
                      data-test-id={`properties-${label}`}
                    >
                      <Icon.Circle
                        size={35}
                        color={label.toLowerCase()}
                        data-test-id={`toggle-state-${
                          label.toLowerCase() === color?.toLowerCase()
                            ? "on"
                            : "off"
                        }`}
                      />
                      {label.toLowerCase() === color?.toLowerCase() && (
                        <Icon.Checkmark
                          color="static"
                          size={18}
                          sx={{ position: "absolute", left: "8px" }}
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
                      },
                      flexDirection: "column"
                    }}
                    onClick={() => {
                      navigate(`/notebooks/${notebook.data.id}`);
                    }}
                  >
                    <Text
                      variant="body"
                      sx={{ alignItems: "center", display: "flex" }}
                    >
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
                  data-test-id={`session-item`}
                  py={1}
                  px={2}
                  sx={{
                    cursor: "pointer",
                    bg: isSelected ? "bgSecondary" : "transparent",
                    ":hover": {
                      bg: "hover"
                    },
                    alignItems: "center",
                    justifyContent: "space-between"
                  }}
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
                  <Text variant={"body"} data-test-id="title">
                    {label}
                  </Text>
                  <Flex sx={{ fontSize: "subBody", color: "fontTertiary" }}>
                    {session.locked && (
                      <Icon.Lock size={14} data-test-id="locked" />
                    )}
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
      sx={{
        borderRadius: "default",
        flexDirection: "column"
      }}
    >
      <Flex mx={2} mt={2} sx={{ alignItems: "center" }}>
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

const CustomInput = forwardRef((props, refs) => {
  return (
    <Input
      ref={refs}
      type="text"
      variant="clean"
      sx={{
        color: "fontTertiary",
        fontSize: "body",
        textAlign: "right",
        m: 0,
        p: 0
      }}
      {...props}
    />
  );
});
