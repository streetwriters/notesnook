import { useEffect } from "react";
import { Flex } from "rebass";
import { getTotalSize } from "../../common/attachments";
import { useStore } from "../../stores/attachment-store";
import { formatBytes } from "../../utils/filename";
import Field from "../field";
import ListContainer from "../list-container";
import AttachmentsPlaceholder from "../placeholders/attachments-placeholder";
import Dialog from "./dialog";

function AttachmentsDialog({ onClose }) {
  const attachments = useStore((store) => store.attachments);
  const refresh = useStore((store) => store.refresh);
  const filter = useStore((store) => store.filter);
  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <Dialog
      isOpen={true}
      width={500}
      title="Attachments"
      description={`${attachments.length} attachments | ${formatBytes(
        getTotalSize(attachments)
      )} occupied`}
      onClose={onClose}
      noScroll
      negativeButton={{ text: "Close", onClick: onClose }}
    >
      <Flex flexDirection={"column"} height={500} px={2}>
        <Field
          placeholder="Filter attachments by filename, type or hash"
          sx={{ mb: 1, px: 1 }}
          onChange={(e) => filter(e.target.value)}
        />
        <ListContainer
          header={<div />}
          type="attachments"
          groupType="attachments"
          placeholder={AttachmentsPlaceholder}
          items={attachments}
        />
      </Flex>
    </Dialog>
  );
}

export default AttachmentsDialog;
