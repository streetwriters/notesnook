import { eSendEvent } from "../../services/event-manager";
import { eCloseSimpleDialog, eOpenSimpleDialog } from "../../utils/events";

type DialogInfo = {
  title?: string;
  paragraph?: string;
  positiveText?: string;
  negativeText?: string;
  positivePress?: (value: any) => void;
  onClose?: () => void;
  positiveType?:
    | "transparent"
    | "gray"
    | "grayBg"
    | "accent"
    | "inverted"
    | "shade"
    | "error"
    | "errorShade";
  icon?: string;
  paragraphColor: string;
  input: boolean;
  inputPlaceholder: string;
  defaultValue: string;
  context: "global" | "local";
};

export function presentDialog(data: Partial<DialogInfo>): void {
  eSendEvent(eOpenSimpleDialog, data);
}

export function hideDialog(): void {
  eSendEvent(eCloseSimpleDialog);
}
