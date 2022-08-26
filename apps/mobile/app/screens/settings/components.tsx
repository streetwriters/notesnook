import React, { ReactElement } from "react";
import { AccentColorPicker, HomagePageSelector } from "./appearance";
import { AutomaticBackupsSelector } from "./backup-restore";
import DebugLogs from "./debug";
import { ConfigureToolbar } from "./editor/configure-toolbar";
import { Subscription } from "./subscription";

export const components: { [name: string]: ReactElement } = {
  colorpicker: <AccentColorPicker wrap={true} />,
  homeselector: <HomagePageSelector />,
  autobackups: <AutomaticBackupsSelector />,
  subscription: <Subscription />,
  configuretoolbar: <ConfigureToolbar />,
  "debug-logs": <DebugLogs />
};
