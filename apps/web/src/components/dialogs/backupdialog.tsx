import { Text } from "rebass";
import { createBackup } from "../../common";
import Dialog from "./dialog";

type BackupDialogProps = {
  onClose: () => void;
};
function BackupDialog(props: BackupDialogProps) {
  return (
    <Dialog
      isOpen={true}
      alignment="center"
      onClose={props.onClose}
      title="Your backup is ready"
      description="Download a backup of your notes to keep them safe."
      positiveButton={{
        text: "Save to disk",
        onClick: async () => {
          await createBackup(true);
          props.onClose();
        },
      }}
      negativeButton={{
        text: "Remind me later",
        onClick: async () => {
          await createBackup(false);
          props.onClose();
        },
      }}
    >
      <Text variant={"body"}>
        In case forget your password or something unfortunate happens, you can
        restore a backup to recover lost data.{" "}
      </Text>
    </Dialog>
  );
}

export default BackupDialog;
