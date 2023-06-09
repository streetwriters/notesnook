/*
This file is part of the Notesnook project (https://notesnook.com/)

Copyright (C) 2023 Streetwriters (Private) Limited

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

import { useCallback, useEffect, useState } from "react";
import { desktop } from "../common/desktop-bridge";

export type DesktopIntegrationSettings = {
  autoStart: boolean;
  startMinimized: boolean;
  minimizeToSystemTray: boolean;
  closeToSystemTray: boolean;
};

export default function useDesktopIntegration() {
  const [settings, changeSettings] = useState<DesktopIntegrationSettings>();

  const setupDesktopIntegration = useCallback(async () => {
    const settings = await desktop?.integration.desktopIntegration.query();
    changeSettings(settings);
    return settings;
  }, []);

  useEffect(() => {
    (async function () {
      await setupDesktopIntegration();
    })();
  }, [setupDesktopIntegration]);

  const set = useCallback(
    async (_settings: Partial<DesktopIntegrationSettings>) => {
      if (!settings) return;

      await desktop?.integration.setDesktopIntegration.mutate({
        ...settings,
        ..._settings
      });
      await setupDesktopIntegration();
    },
    [settings, setupDesktopIntegration]
  );

  return [settings, set] as const;
}
