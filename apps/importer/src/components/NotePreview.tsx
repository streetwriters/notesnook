import { Button, Flex, Text } from "@theme-ui/components";
import { IoStarOutline } from "react-icons/io5";
import { GrPin } from "react-icons/gr";
import { MdCircle, MdClose, MdOutlineBook } from "react-icons/md";
import { Markup } from "interweave";
import Modal from "react-modal";
import { Note } from "@notesnook/importer/dist/src/models/note";
Modal.setAppElement("#root");

type NotePreviewProps = {
  note: Note;
  onClose: () => void;
};

export function NotePreview(props: NotePreviewProps) {
  const {
    title,
    content,
    dateEdited,
    dateCreated,
    favorite,
    color,
    pinned,
    notebooks,
    tags,
    attachments,
  } = props.note;
  return (
    <Modal
      isOpen={true}
      contentLabel={title}
      style={{
        content: {
          borderRadius: 10,
          border: "1px solid var(--theme-ui-colors-border)",
          boxShadow: "0px 0px 20px 0px #00000011",
        },
      }}
    >
      <Flex sx={{ flexDirection: "column" }}>
        <Flex sx={{ justifyContent: "space-between", alignItems: "center" }}>
          <Text variant="subBody">
            This preview is not an exact representation of how the note will
            appear in Notesnook.
          </Text>
          <Button
            variant="secondary"
            sx={{
              bg: "transparent",
              display: "flex",
              alignSelf: "end",
              p: 0,
              m: 0,
              alignItems: "center",
            }}
            onClick={props.onClose}
          >
            <MdClose size={24} />
          </Button>
        </Flex>
        <Text as="h1" variant="subheading">
          {title}
        </Text>
        <Flex sx={{ alignItems: "center" }}>
          {color && (
            <MdCircle color={color} size={14} style={{ marginRight: 5 }} />
          )}
          {favorite && <IoStarOutline style={{ marginRight: 5 }} />}
          {pinned && <GrPin size={12} style={{ marginRight: 5 }} />}
          {dateCreated && (
            <>
              <Text variant="subBody">
                Created on: {formatDate(dateCreated)}
              </Text>
            </>
          )}
          {dateEdited && (
            <>
              <MdCircle
                color="#5b5b5b"
                size={7}
                style={{ marginLeft: 3, marginRight: 3 }}
              />
              <Text variant="subBody">
                Last modified: {formatDate(dateEdited)}
              </Text>
            </>
          )}
          {attachments && (
            <>
              <MdCircle
                color="#5b5b5b"
                size={7}
                style={{ marginLeft: 3, marginRight: 3 }}
              />
              <Text variant="subBody">{attachments.length} attachments</Text>
            </>
          )}
        </Flex>
        <Flex my={1}>
          {notebooks?.map((notebook) => (
            <Flex
              key={notebook.notebook + notebook.topic}
              sx={{
                alignItems: "center",
                bg: "bgSecondary",
                mr: 1,
                p: 1,
                py: "2px",
                border: "1px solid var(--theme-ui-colors-border)",
                borderRadius: "default",
                color: "fontTertiary",
              }}
            >
              <MdOutlineBook size={11} />
              <Text variant="subBody" sx={{ ml: "2px" }}>
                {notebook.notebook} &gt; {notebook.topic}
              </Text>
            </Flex>
          ))}
          {tags?.map((tag) => (
            <Text
              key={tag}
              variant="subBody"
              sx={{
                bg: "bgSecondary",
                mr: 1,
                p: 1,
                py: "2px",
                border: "1px solid var(--theme-ui-colors-border)",
                borderRadius: "default",
                color: "fontTertiary",
              }}
            >
              #{tag}
            </Text>
          ))}
        </Flex>
        <Text variant="body">
          <Markup content={content?.data} />
        </Text>
      </Flex>
    </Modal>
  );
}

function formatDate(date: number) {
  return new Date(date).toLocaleString(undefined, {
    dateStyle: "short",
    timeStyle: "short",
  });
}
