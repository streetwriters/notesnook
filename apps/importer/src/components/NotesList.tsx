import { Flex, Text } from "@theme-ui/components";
import { Note } from "@notesnook/importer/dist/src/models/note";
import { Accordion } from "./Accordion";

type NotesListProps = {
  notes: Note[];
  filesLength: number;
  onNoteSelected: (note: Note) => void;
};
export function NotesList(props: NotesListProps) {
  const { notes, filesLength, onNoteSelected } = props;

  return (
    <Accordion
      title={`${notes.length} notes found in ${filesLength} ${
        filesLength > 1 ? "files" : "file"
      }`}
      sx={{
        border: "1px solid var(--theme-ui-colors-border)",
        mt: 2,
        borderRadius: "default",
      }}
    >
      <Flex
        sx={{
          flexDirection: "column",
          overflowY: "auto",
          maxHeight: 300,
        }}
      >
        {notes.map((note, index) => (
          <Flex
            sx={{
              flexDirection: "column",
              p: 2,
              bg: index % 2 ? "transparent" : "bgSecondary",
              cursor: "pointer",
              ":hover": {
                bg: "hover",
              },
            }}
            onClick={() => {
              onNoteSelected(note);
            }}
            title="Click to preview"
          >
            <Text variant="body">{note.title}</Text>
            {note.dateEdited && (
              <Text variant="subBody">
                Last modified on:{" "}
                {new Date(note.dateEdited).toLocaleString(undefined, {
                  dateStyle: "short",
                  timeStyle: "short",
                })}
              </Text>
            )}
          </Flex>
        ))}
      </Flex>
    </Accordion>
  );
}
