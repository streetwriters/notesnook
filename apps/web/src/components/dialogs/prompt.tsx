import { useRef } from "react";
import { Perform } from "../../common/dialog-controller";
import Field from "../field";
import Dialog from "./dialog";

export type PromptDialogProps = {
  onClose: Perform;
  title: string;
  onSave: (text: string) => void;
  description?: string;
  defaultValue?: string;
};

export default function Prompt(props: PromptDialogProps) {
  const inputRef = useRef<HTMLInputElement>();
  return (
    <Dialog
      isOpen={true}
      title={props.title}
      description={props.description}
      onClose={props.onClose}
      positiveButton={{
        text: "Done",
        onClick: () => props.onSave(inputRef.current?.value || "")
      }}
      negativeButton={{ text: "Cancel", onClick: props.onClose }}
    >
      <Field inputRef={inputRef} defaultValue={props.defaultValue} autoFocus />
    </Dialog>
  );
}
