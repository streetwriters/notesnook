import {Platform} from "react-native";
import {db} from "../utils/DB";
import RNFetchBlob from "rn-fetch-blob";
import {ToastEvent} from "./EventManager";
import he from "he";
import RNHTMLtoPDF from "react-native-html-to-pdf";
import Storage from "../utils/Storage";

const dirs = RNFetchBlob.fs.dirs;

export async function saveToPDF(note) {
    let androidSavePath = '/Notesnook/exported/PDF';
    if (Platform.OS === 'android') {
        let hasPermission = await Storage.requestPermission();
        if (!hasPermission) {
            ToastEvent.show('Failed to get storage permission');
            return null;
        }
    } else {
        await Storage.checkAndCreateDir (dirs.DocumentDir + '/exported/PDF/');
    }

    let html = await db.notes.note(note).export('html');

    html = he.decode(html);
    let options = {
        html: html,
        fileName:
            Platform.OS === 'ios' ? '/exported/PDF/' + note.title : note.title,
        directory: Platform.OS === 'ios' ? 'Documents' : androidSavePath,
    };
    let res = await RNHTMLtoPDF.convert(options);

    return {
        filePath: res.filePath,
        type: 'application/pdf',
        name: 'PDF',
    };
}

export async function saveToMarkdown(note) {
    let savePath =
        Platform.OS === 'ios'
            ? dirs.DocumentDir + '/exported/Markdown/'
            : dirs.SDCardDir + '/Notesnook/exported/Markdown/';

    await Storage.checkAndCreateDir(savePath);
    let markdown = await db.notes.note(note.id).export('md');

    let path = savePath + note.title + '.md';
    await RNFetchBlob.fs.writeFile(path, markdown, 'utf8');

    return {
        filePath: path,
        type: 'text/markdown',
        name: 'Markdown',
    };
}

export async function saveToText(note) {
    let savePath =
        Platform.OS === 'ios'
            ? dirs.DocumentDir + '/exported/Text/'
            : dirs.SDCardDir + '/Notesnook/exported/Text/';
    await Storage.checkAndCreateDir(savePath);
    let markdown = await db.notes.note(note.id).export('txt');

    let path = savePath + note.title + '.txt';
    await RNFetchBlob.fs.writeFile(path, markdown, 'utf8');

    return {
        filePath: path,
        type: 'text/plain',
        name: 'Text',
    };
}

export async function saveToHTML(note) {
    let savePath =
        Platform.OS === 'ios'
            ? dirs.DocumentDir + '/exported/Html/'
            : dirs.SDCardDir + '/Notesnook/exported/Html/';
    await Storage.checkAndCreateDir(savePath);
    let markdown = await db.notes.note(note.id).export('html');

    let path = savePath + note.title + '.html';
    await RNFetchBlob.fs.writeFile(path, markdown, 'utf8');

    return {
        filePath: path,
        type: 'text/html',
        name: 'Html',
    };
}