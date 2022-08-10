/* eslint-disable @typescript-eslint/no-var-requires */
import { setJSExceptionHandler, getJSExceptionHandler } from 'react-native-exception-handler';

global.Buffer = require('buffer').Buffer;
//import { ScriptManager, Script } from '@callstack/repack/client';
import './src/utils/logger/index';
import { DOMParser } from './worker.js';

// class DOM {
//   static domparser;

//   parseFromString(markupLanguage, mimeType, globals) {
//     return DOM.domparser?.parseFromString(markupLanguage, mimeType, globals);
//   }

//   static async prepare() {
//     if (!DOM.domparser) {
//       let module = await import('./worker.js');
//       DOM.domparser = new module.DOMParser();
//     }
//   }
// }
global.DOMParser = DOMParser;

//=================================================
// ADVANCED use case:
const exceptionhandler = (error, isFatal) => {
  // TODO
};
setJSExceptionHandler(exceptionhandler, true);

// try {
//   const shared = ScriptManager.shared;
// } catch (e) {
//   new ScriptManager({
//     resolve: async (scriptId, caller) => {
//       if (__DEV__) {
//         return {
//           url: Script.getDevServerURL(scriptId),
//           cache: false
//         };
//       }

//       return {
//         url: Script.getFileSystemURL(scriptId)
//       };
//     }
//   });
// }
if (__DEV__) {
  // ScriptManager.shared.on('resolving', (...args) => {
  //   console.log('DEBUG/resolving', ...args);
  // });
  // ScriptManager.shared.on('resolved', (...args) => {
  //   console.log('DEBUG/resolved', ...args);
  // });
  // ScriptManager.shared.on('prefetching', (...args) => {
  //   console.log('DEBUG/prefetching', ...args);
  // });
  // ScriptManager.shared.on('loading', (...args) => {
  //   console.log('DEBUG/loading', ...args);
  // });
  // ScriptManager.shared.on('loaded', (...args) => {
  //   console.log('DEBUG/loaded', ...args);
  // });
  // ScriptManager.shared.on('error', (...args) => {
  //   console.log('DEBUG/error', ...args);
  // });
}
