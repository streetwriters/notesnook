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
import { NativeModules, DeviceEventEmitter } from "react-native";
import { useState, useEffect, useRef } from "react";
import { useSettingStore } from "../../stores/use-setting-store";
import { Config } from "react-native-config";
import { DatabaseLogger } from "../../common/database";
interface SplitInstallSessionState {
  status:
    | "pending"
    | "downloading"
    | "downloaded"
    | "installing"
    | "installed"
    | "failed"
    | "cancelled"
    | "requires_user_confirmation"
    | "user_permission_granted"
    | "user_permission_canceled"
    | "canceling";
  total?: number;
  downloaded?: number;
  errorCode?: number;
}

export const useSplitInstallSessionState = () => {
  const [state, setState] = useState<SplitInstallSessionState | undefined>();

  useEffect(() => {
    const subscription = DeviceEventEmitter.addListener(
      "onModuleLoaderStateUpdate",
      (data: SplitInstallSessionState) => {
        setState(data);
      }
    );
    return () => {
      subscription?.remove();
    };
  }, []);

  return state;
};

export const SplitModuleLoader: {
  installModule: (name: string) => Promise<number>;
  getInstalledModules: () => Promise<string[]>;
} = NativeModules.SplitModuleLoader;

export const useIsGeckoViewEnabled = () => {
  const [loading, setLoading] = useState(true);
  const [enabled, setEnabled] = useState(false);
  const useGeckoView = useSettingStore((state) => state.settings.useGeckoView);
  const ref = useRef();
  const state = useSplitInstallSessionState();
  useEffect(() => {
    if (Config.GITHUB_RELEASE === "true") {
      if (Config.enableGecko === "true") {
        ref.current = require("@ammarahmed/react-native-geckoview").default;
        setEnabled(true);
        DatabaseLogger.log("Using GeckoView");
      } else {
        DatabaseLogger.log("Using Android WebView");
      }
      setLoading(false);
      return;
    }
    SplitModuleLoader.getInstalledModules()
      .then((modules) => {
        if (modules?.includes("geckoview")) {
          ref.current = require("@ammarahmed/react-native-geckoview").default;
          setEnabled(true);
          DatabaseLogger.log("Using GeckoView");
        } else {
          DatabaseLogger.log("Using Android WebView");
        }
        setLoading(false);
      })
      .catch((e) => {
        setLoading(false);
        setEnabled(false);
        DatabaseLogger.error(e);
        DatabaseLogger.log("Using Android WebView");
      });
  }, [loading, useGeckoView, state?.status]);
  return {
    enabled: enabled && useGeckoView,
    loading: loading,
    installed: enabled,
    view: ref
  };
};
