import { Button, Text } from "@theme-ui/components";
import { Accordion } from "./Accordion";

type ImportHelpProps = {
  onDownload: () => void;
};

export function ImportHelp(props: ImportHelpProps) {
  return (
    <Accordion
      title="How to import your notes into Notesnook?"
      sx={{ bg: "bgSecondary", mt: 2, borderRadius: "default" }}
    >
      <Text
        as="ol"
        variant="body"
        sx={{
          lineHeight: "24px",
          paddingInlineStart: 30,
          pb: 2,
        }}
      >
        <Text as="li">
          <Button variant="primary" sx={{ py: 0 }} onClick={props.onDownload}>
            Download the ZIP file
          </Button>{" "}
          containing your notes
        </Text>
        <Text as="li">
          <a href="https://app.notesnook.com/">Open Notesnook</a> and make sure
          you are logged in.
        </Text>
        <Text as="li">
          Go to <b>Settings</b>
        </Text>
        <Text as="li">
          Expand the section titled <b>Notesnook Importer</b>
        </Text>
        <Text as="li">
          Click on <b>Import from ZIP file</b>
        </Text>
        <Text as="li">Select the downloaded ZIP file</Text>
        <Text as="li">Your notes should appear in the app.</Text>
      </Text>
    </Accordion>
  );
}
