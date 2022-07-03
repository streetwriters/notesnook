/* eslint-disable @typescript-eslint/no-var-requires */
global.Buffer = require('buffer').Buffer;
import { DOMParser } from './worker';
import './src/utils/logger/index';
global.DOMParser = DOMParser;
