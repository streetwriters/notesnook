import { eSendEvent } from "../../services/EventManager";
import { eCloseSimpleDialog, eOpenSimpleDialog } from "../../utils/Events";

type DialogInfo = {
  title?: string,
  paragraph?: string,
  positiveText?: string,
  negativeText?: string,
  positivePress?: (value:any) => void,
  onClose?: () => void,
  positiveType?: "transparent" | "gray" | "grayBg" | "accent" | "inverted" | "shade" | "error" | "errorShade",
  icon?: string,
  paragraphColor: string,
  input:boolean,
  inputPlaceholder:string,
  defaultValue:string,
  context:"global" | "local"
}

export function presentDialog(data: DialogInfo): void {
  eSendEvent(eOpenSimpleDialog, data);
}

export function hideDialog(): void {

  eSendEvent(eCloseSimpleDialog);

}