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

import { useEffect, useRef, type PropsWithChildren } from "react";
import { usePromise } from "@notesnook/common";
import { lifecycle } from "@platform";
import { getDocumentTitle, setDocumentTitle } from "../utils/dom";
import { useKeyStore } from "../interfaces/key-store";
import { DialogManager } from "../common/dialog-manager";
import { UnlockScreen } from "../components/unlock-screen";
import { useWindowReveal } from "../components/window-reveal";

export default function AppLock(props: PropsWithChildren<unknown>) {
  const credentials = useKeyStore((store) => store.activeCredentials());
  const isLocked = useKeyStore((store) => store.isLocked);
  const isInitialized = useKeyStore((store) => store.isInitialized);
  const _lockAfter = useKeyStore((store) => store.secrets.lockAfter);
  const lockAfter = usePromise(async () => {
    if (isLocked || !isInitialized) return null;
    return (await useKeyStore.getState().getValue("lockAfter")) || 0;
  }, [isLocked, isInitialized, _lockAfter]);

  const markContentReady = useWindowReveal();

  useEffect(() => {
    if (isLocked) markContentReady();
  }, [isLocked, markContentReady]);

  const windowTitle = useRef(getDocumentTitle());

  useEffect(() => {
    if (isLocked) {
      windowTitle.current = getDocumentTitle();
      // ../common/dialog-controller  closeOpenedDialog();
      setDocumentTitle(`Notesnook 🔒`);
    } else {
      setDocumentTitle(windowTitle.current);
    }
  }, [isLocked]);

  useEffect(() => {
    if (
      lockAfter.status !== "fulfilled" ||
      lockAfter.value === null ||
      credentials.length <= 0
    )
      return;

    if (lockAfter.value > 0) {
      const stop = lifecycle.startIdleDetection(
        lockAfter.value * 60 * 1000,
        () => useKeyStore.getState().relock()
      );
      return () => stop();
    } else if (lockAfter.value === 0) {
      const stop = lifecycle.onVisibilityChanged((_, hidden) => {
        if (hidden) useKeyStore.getState().relock();
      });

      return () => stop();
    }
  }, [lockAfter, credentials]);

  useEffect(() => {
    if (isLocked) {
      DialogManager.closeAll();
    }
  }, [isLocked]);

  if (isLocked) return <UnlockScreen credentials={credentials} />;

  return <>{props.children}</>;
}
