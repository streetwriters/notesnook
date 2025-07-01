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
/* eslint-disable no-var */

import "vite/client";
import "vite-plugin-svgr/client";
import "@notesnook/desktop/dist/preload";

declare global {
  var PUBLIC_URL: string;
  var APP_VERSION: string;
  var GIT_HASH: string;
  var IS_DESKTOP_APP: boolean;
  var IS_TESTING: boolean;
  var PLATFORM: "web" | "desktop";
  var IS_BETA: boolean;
  var APP_TITLE: string;
  var IS_THEME_BUILDER: boolean;
  var hasNativeTitlebar: boolean;

  interface Window {
    ApplePaySession?: PaymentRequest;
  }

  interface AuthenticationExtensionsClientInputs {
    prf?: {
      eval: {
        first: BufferSource;
      };
    };
  }

  interface AuthenticationExtensionsClientOutputs {
    prf?: {
      enabled?: boolean;
      results?: {
        first: ArrayBuffer;
      };
    };
  }

  interface PublicKeyCredentialRequestOptions {
    hints?: ("security-key" | "client-device" | "hybrid")[];
  }
  interface PublicKeyCredentialCreationOptions {
    hints?: ("security-key" | "client-device" | "hybrid")[];
  }

  interface FileSystemFileHandle {
    createSyncAccessHandle(options?: {
      mode: "read-only" | "readwrite" | "readwrite-unsafe";
    }): Promise<FileSystemSyncAccessHandle>;
  }
  interface Navigator {
    windowControlsOverlay?: {
      getTitlebarAreaRect(): DOMRect;
      visible: boolean;
    };
  }
  interface Window {
    ApplePaySession?: {
      canMakePayments(): boolean | Promise<boolean>;
    };
  }
}
