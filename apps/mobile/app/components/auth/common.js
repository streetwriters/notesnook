import { createRef } from "react";
import { eSendEvent } from "../../services/event-manager";
import Navigation from "../../services/navigation";
import SettingsService from "../../services/settings";
import { eCloseLoginDialog } from "../../utils/events";
import { tabBarRef } from "../../utils/global-refs";

export const initialAuthMode = createRef(0);
export function hideAuth() {
  eSendEvent(eCloseLoginDialog);

  // if (initialAuthMode.current === 2) {
  //   Navigation.replace(
  //     {
  //       name: 'Notes'
  //     },
  //     {
  //       menu: true
  //     }
  //   );
  // } else {
  //   Navigation.goBack();
  // }

  // tabBarRef.current?.unlock();
}
