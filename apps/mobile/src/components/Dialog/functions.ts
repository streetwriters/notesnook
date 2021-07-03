import { eSendEvent } from "../../services/EventManager";
import { eCloseSimpleDialog, eOpenSimpleDialog } from "../../utils/Events";

type DialogInfo = {
  title?: string,
  paragraph?: string,
  positiveText?: string,
  negativeText?: string,
  positivePress?: () => void,
  onClose?: () => void,
  positiveType?: "transparent" | "gray" | "grayBg" | "accent" | "inverted" | "shade" | "error" | "errorShade",
  icon?: string,
  paragraphColor: string
}

export function presentDialog(data: DialogInfo): void {
  eSendEvent(eOpenSimpleDialog, data);
}

export function hideDialog(): void {

  eSendEvent(eCloseSimpleDialog);

}