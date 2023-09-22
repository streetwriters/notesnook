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
import React, {
  createRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState
} from "react";
import { Platform } from "react-native";
import RNFetchBlob from "react-native-blob-util";
import WebView from "react-native-webview";
import { Config } from "./store";
import { db } from "../app/common/database";
import { SUBSCRIPTION_STATUS } from "../app/utils/constants";

export const fetchHandle = createRef();
export const HtmlLoadingWebViewAgent = React.memo(
  () => {
    const [source, setSource] = useState(null);
    const [clipper, setClipper] = useState(null);
    const loadHandler = useRef();
    const htmlHandler = useRef();
    const webview = useRef();
    const premium = useRef(false);
    const corsProxy = Config.corsProxy;

    useImperativeHandle(
      fetchHandle,
      () => ({
        processUrl: (url) => {
          return new Promise((resolve) => {
            setSource(url);
            let resolved = false;
            htmlHandler.current = (html) => {
              if (resolved) return;
              resolved = true;
              setSource(null);
              resolve(html);
            };
            loadHandler.current = (result) => {
              if (resolved) return;
              if (!result) {
                resolved = true;
                setSource(null);
                resolve(null);
                return;
              }
            };
          });
        }
      }),
      []
    );

    useEffect(() => {
      (async () => {
        const user = await db.user.getUser();
        const subscriptionStatus =
          user?.subscription?.type || SUBSCRIPTION_STATUS.BASIC;
        premium.current =
          user && subscriptionStatus !== SUBSCRIPTION_STATUS.BASIC;

        const clipperPath =
          Platform.OS === "ios"
            ? RNFetchBlob.fs.dirs.MainBundleDir +
              "/extension.bundle/clipper.bundle.js"
            : "bundle-assets://clipper.bundle.js";

        RNFetchBlob.fs
          .readFile(clipperPath, "utf8")
          .then((clipper) => {
            setClipper(clipper);
          })
          .catch((e) => console.log(e));
      })();
    }, []);

    return !source || !clipper ? null : (
      <WebView
        ref={webview}
        onLoad={() => {
          loadHandler.current?.(true);
        }}
        style={{
          width: 100,
          height: 100,
          position: "absolute",
          opacity: 0,
          zIndex: -1
        }}
        useSharedProcessPool={false}
        pointerEvents="none"
        onMessage={(event) => {
          try {
            const data = JSON.parse(event.nativeEvent.data);
            if (data && data.type === "html") {
              console.log("message recieved page loaded");
              htmlHandler.current?.(data.value);
            } else {
              if (data.type === "error") {
                console.log("error", data.value);
                htmlHandler.current?.(null);
              }
            }
          } catch (e) {
            console.log("Error handling webview message", e);
          }
        }}
        injectedJavaScriptBeforeContentLoaded={script(clipper, premium.current)}
        onError={() => {
          console.log("Error loading page");
          loadHandler.current?.();
        }}
        source={{
          uri: source
        }}
      />
    );
  },
  () => true
);

const script = (clipper, pro) => `
${clipper}

function postMessage(type, value) {
  if (window.ReactNativeWebView) {
    window.ReactNativeWebView.postMessage(
      JSON.stringify({
        type: type,
        value: value
      })
    );
  }
}

(() => {
  try {
    const loadFn = () => {
      if (!globalThis.Clipper.clipPage) {
        postMessage("error", globalThis.Clipper.clipPage);
      } else {
        globalThis.Clipper.clipPage(document,false, {
          images: ${pro},
          inlineImages: false,
          styles: false,
          corsProxy: undefined
        }).then(result => {
          postMessage("html", result);
        }).catch(e => {
          postMessage("error");
        });
      }
    };
    window.addEventListener("load",loadFn, false);
  } catch(e) {
    postMessage("error", e.message);
  } 
})();


`;

HtmlLoadingWebViewAgent.displayName = "HtmlLoadingWebViewAgent";
