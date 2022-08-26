import { useEffect, useState } from "react";
import { useAttachmentStore } from "../stores/use-attachment-store";

export const useAttachmentProgress = (attachment, encryption) => {
  const progress = useAttachmentStore((state) => state.progress);
  const [currentProgress, setCurrentProgress] = useState(
    encryption
      ? {
          type: "encrypt"
        }
      : null
  );

  useEffect(() => {
    let prog = progress[attachment.metadata.hash];
    if (prog) {
      let type = prog.type;
      let loaded = prog.type === "download" ? prog.recieved : prog.sent;
      prog = loaded / prog.total;
      prog = (prog * 100).toFixed(0);
      console.log("progress: ", prog);
      console.log(prog);
      setCurrentProgress({
        value: prog,
        percent: prog + "%",
        type: type
      });
    } else {
      setCurrentProgress(null);
    }
  }, [progress]);

  return [currentProgress, setCurrentProgress];
};
