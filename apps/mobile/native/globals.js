/* eslint-disable @typescript-eslint/no-var-requires */
import "@azure/core-asynciterator-polyfill";
import 'react-native-url-polyfill/auto';
import "./polyfills/console-time.js"
global.Buffer = require('buffer').Buffer;
import '../app/common/logger/index';
import { DOMParser } from './worker.js';
import { ScriptManager, Script } from '@callstack/repack/client';
global.DOMParser = DOMParser;

ScriptManager.shared.addResolver(async (scriptId) => {
    // `scriptId` will be either 'student' or 'teacher'
  
    // In dev mode, resolve script location to dev server.
    if (__DEV__) {
      return {
        url: Script.getDevServerURL(scriptId),
        cache: false,
      };
    }
  
    return {
      url: Script.getFileSystemURL(scriptId)
    };
  });