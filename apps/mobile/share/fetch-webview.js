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
import React, { useEffect } from "react";
import { createRef, useImperativeHandle, useRef, useState } from "react";
import WebView from "react-native-webview";
import { Config } from "./store";
import RNFetchBlob from "react-native-blob-util";
import { Platform } from "react-native";

export const fetchHandle = createRef();
export const HtmlLoadingWebViewAgent = React.memo(
  () => {
    const [source, setSource] = useState(null);
    const [clipper, setClipper] = useState(null);
    const loadHandler = useRef();
    const htmlHandler = useRef();
    const webview = useRef();
    useImperativeHandle(
      fetchHandle,
      () => ({
        processUrl: (url) => {
          return new Promise((resolve) => {
            setSource(url);
            console.log("processing...", url);
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
              console.log("loaded event fired");
            };
          });
        }
      }),
      []
    );

    useEffect(() => {
      const clipperPath =
        Platform.OS === "ios"
          ? RNFetchBlob.fs.dirs.MainBundleDir +
            "/extension.bundle/clipper.bundle.js"
          : RNFetchBlob.fs.asset("clipper.bundle.js");
      RNFetchBlob.fs.readFile(clipperPath, "utf8").then((clipper) => {
        setClipper(clipper);
      });
    }, []);

    return !source || !clipper ? null : (
      <WebView
        ref={webview}
        onLoad={() => {
          console.log("Webview is loaded");
          loadHandler.current?.(true);
        }}
        style={{
          width: 100,
          height: 100,
          position: "absolute",
          opacity: 0,
          zIndex: -1
        }}
        pointerEvents="none"
        onMessage={(event) => {
          try {
            const data = JSON.parse(event.nativeEvent.data);
            if (data && data.type === "html") {
              console.log("message recieved page loaded");
              htmlHandler.current?.(data.value);
            } else {
              if (data.type === "error") {
                htmlHandler.current?.(null);
              }
            }
          } catch (e) {
            console.log("Error handling webview message", e);
          }
        }}
        injectedJavaScript={`
        ${clipper}
        window.onload = () => {
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
          
          globalThis.Clipper.clipArticle(document, {
            images: true,
            corsProxy: false
          }).then(result => {
            postMessage("html", result);
          }).catch(e => {
            postMessage("error");
          })

        };`}
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
HtmlLoadingWebViewAgent.displayName = "HtmlLoadingWebViewAgent";

const old = `
window.onload = () => {
        // Function to convert relative URLs to absolute URLs
        function fixRelativeUrls(baseUrl, elements, attribute) {
          elements.forEach((element) => {
            const relativeUrl = element.getAttribute(attribute);
            if (relativeUrl) {
              const absoluteUrl = new URL(relativeUrl, baseUrl).href;
              element.setAttribute(attribute, absoluteUrl);
            }
          });
        }
      
        // Function to remove unnecessary attributes from elements
        function removeUnnecessaryAttributes(elements) {
          elements.forEach((element) => {
            // Remove unnecessary attributes
            const unnecessaryAttributes = ["class", "id", "style", "data-*"];
            unnecessaryAttributes.forEach((attr) => element.removeAttribute(attr));
          });
        }
      
        // Function to exclude specific tags
        function excludeTags(elements) {
          elements.forEach((element) => {
            element.remove();
          });
        }
      
        // Extract the HTML content and modify it
        function extractAndModifyHtml() {
          const baseUrl = window.location.href;
          const htmlContent = document.documentElement.outerHTML;
      
          // Exclude specific tags (e.g., styles, scripts, and others)
          const tagsToExclude = [
            "style",
            "script",
            "head",
            "button",
            "select",
            "form",
            "link",
            "canvas",
            "nav",
            "svg",
            "audio",
            "video",
            "iframe",
            "object",
            "input",
            "textarea",
            "footer",
            "dialog"
          ];
          const elementsToExclude = tagsToExclude
            .map((tagName) => [...document.querySelectorAll(tagName)])
            .flat();
          excludeTags(elementsToExclude);
      
          // Select the remaining elements after excluding specific tags
          const remainingElements = [...document.querySelectorAll("*")];
      
          // Remove unnecessary attributes from the remaining elements
          removeUnnecessaryAttributes(remainingElements);
      
          // Convert relative URLs to absolute URLs in links, images, and other attributes
          const elementsToFixUrls = [
            ...document.querySelectorAll(
              "a[href], img[src], link[href], script[src], iframe[src], form[action], object[data]"
            )
          ];
          fixRelativeUrls(baseUrl, elementsToFixUrls, "href");
          fixRelativeUrls(baseUrl, elementsToFixUrls, "src");
          fixRelativeUrls(baseUrl, elementsToFixUrls, "action");
          fixRelativeUrls(baseUrl, elementsToFixUrls, "data");
      
          return document.documentElement.outerHTML;
        }
      
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
      
        const html = extractAndModifyHtml();
        postMessage("html", html);
      };
`;
