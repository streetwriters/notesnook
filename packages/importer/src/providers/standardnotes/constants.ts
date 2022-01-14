import { EditorType } from './types';
export const editors: {
    [name: string]: EditorType;
  } = {
    "Vim Editor": {
      type: "code",
    },
    "Secure Spreadsheets": {
      type: "json",
      jsonFormat: "table",
    },
    "Minimal Markdown Editor": {
      type: "markdown",
    },
    "Fancy Markdown Editor": {
      type: "markdown",
    },
    "Advanced Markdown Editor": {
      type: "markdown",
    },
    TokenVault: {
      type: "json",
      jsonFormat: "token",
    },
    "Plus Editor": {
      type: "html",
    },
    "Simple Task Editor": {
      type: "markdown",
    },
    "Code Editor": {
      type: "code",
    },
    "Bold Editor": {
      type: "html",
    },
    "Simple Markdown Editor": {
      type: "markdown",
    },
  };

  export const SNBackupVersion = "004";