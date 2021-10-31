import React from 'react';
import {Platform, View} from 'react-native';
import DocumentPicker from 'react-native-document-picker';
import Sodium from 'react-native-sodium';
import {launchCamera, launchImageLibrary} from 'react-native-image-picker';
import RNFetchBlob from 'rn-fetch-blob';
import {Attachment} from '../../../../components/AttachmentDialog';
import {eSendEvent, ToastEvent} from '../../../../services/EventManager';
import {editing} from '../../../../utils';
import {db} from '../../../../utils/database';
import {
  eCloseProgressDialog,
  eOpenProgressDialog
} from '../../../../utils/Events';
import {sleep} from '../../../../utils/TimeUtils';
import {EditorWebView, getNote} from '../../Functions';
import tiny, {safeKeyboardDismiss} from '../tiny';

const FILE_SIZE_LIMIT = 500 * 1024 * 1024;
const IMAGE_SIZE_LIMIT = 50 * 1024 * 1024;

const showEncryptionSheet = file => {
  eSendEvent(eOpenProgressDialog, {
    title: 'Encrypting attachment',
    paragraph: 'Please wait while we encrypt file for upload',
    nowarn: true,
    icon: 'attachment',
    component: (
      <View
        style={{
          paddingHorizontal: 12
        }}>
        <Attachment
          attachment={{
            metadata: {
              filename: file.name
            },
            length: file.size
          }}
          encryption
        />
      </View>
    )
  });
};

const santizeUri = uri => {
  uri = decodeURI(uri);
  uri = Platform.OS === 'ios' ? uri.replace('file:///', '/') : uri;
  return uri;
};

const file = async () => {
  try {
    let options = {
      mode: 'import',
      allowMultiSelection: false
    };
    if (Platform.OS == 'ios') {
      options.copyTo = 'cachesDirectory';
    }

    let key = await db.attachments.generateKey();

    console.log('generated key for attachments: ', key);
    let file;
    try {
      file = await DocumentPicker.pick(options);
    } catch (e) {
      return;
    }

    file = file[0];
    if (file.type.startsWith('image')) {
      ToastEvent.show({
        title: 'Type not supported',
        message: 'Please add images from gallery or camera picker.',
        type: 'error'
      });
      return;
    }
    if (file.size > FILE_SIZE_LIMIT) {
      ToastEvent.show({
        title: 'File too large',
        message: 'The maximum allowed size per file is 500 MB',
        type: 'error'
      });
      return;
    }

    if (file.copyError) {
      ToastEvent.show({
        heading: 'Failed to open file',
        message: file.copyError,
        type: 'error',
        context: 'global'
      });
      return;
    }

    let uri = Platform.OS === 'ios' ? file.fileCopyUri : file.uri;
    console.log('file uri: ', uri);
    uri = Platform.OS === 'ios' ? santizeUri(uri) : uri;
    showEncryptionSheet(file);
    let hash = await Sodium.hashFile({
      uri: uri,
      type: 'url'
    });
    console.log('decoded uri: ', uri);
    let result = await attachFile(uri, hash, file.type, file.name, 'file');
    console.log('attach file: ', result);

    setTimeout(() => {
      eSendEvent(eCloseProgressDialog);
    }, 1000);
    if (!result) return;
    tiny.call(
      EditorWebView,
      `
    (function() {
      let file = ${JSON.stringify({
        hash: hash,
        filename: file.name,
        type: file.type,
        size: file.size
      })}
      editor.undoManager.transact(function() {
        tinymce.activeEditor.execCommand('mceAttachFile',file);
        setTimeout(function() {
          tinymce.activeEditor.nodeChanged({selectionChange:true})
        },100)
       }); 
  
      
    })();
    `
    );
  } catch (e) {
    ToastEvent.show({
      heading: e.message,
      message: 'You need internet access to attach a file',
      type: 'error',
      context: 'global'
    });
    console.log('attachment error: ', e);
  }
};

const camera = async () => {
  try {
    await db.attachments.generateKey();
    eSendEvent(eCloseProgressDialog);
    await sleep(400);
    launchCamera(
      {
        includeBase64: true,
        maxWidth: 4000,
        maxHeight: 4000,
        quality: 0.8,
        mediaType: 'photo'
      },
      handleImageResponse
    );
  } catch (e) {
    ToastEvent.show({
      heading: e.message,
      message: 'You need internet access to attach a file',
      type: 'error',
      context: 'global'
    });
    console.log('attachment error:', e);
  }
};

const gallery = async () => {
  try {
    await db.attachments.generateKey();
    eSendEvent(eCloseProgressDialog);
    await sleep(400);
    launchImageLibrary(
      {
        includeBase64: true,
        maxWidth: 4000,
        maxHeight: 4000,
        quality: 0.8,
        mediaType: 'photo',
        selectionLimit: 1
      },
      handleImageResponse
    );
  } catch (e) {
    ToastEvent.show({
      heading: e.message,
      message: 'You need internet access to attach a file',
      type: 'error',
      context: 'global'
    });
    console.log('attachment error:', e);
  }
};

const pick = async () => {
  if (editing.isFocused) {
    safeKeyboardDismiss();
    await sleep(500);
    editing.isFocused = true;
  }
  eSendEvent(eOpenProgressDialog, {
    noProgress: true,
    noIcon: true,
    actionsArray: [
      {
        action: async () => {
          eSendEvent(eCloseProgressDialog);
          await sleep(400);
          await file();
        },
        actionText: 'Attach a file',
        icon: 'file'
      },
      {
        action: camera,
        actionText: 'Open camera',
        icon: 'camera'
      },
      {
        action: gallery,
        actionText: 'Select image from gallery',
        icon: 'image-multiple'
      }
    ]
  });

  return;
};

const handleImageResponse = async response => {
  if (
    response.didCancel ||
    response.errorMessage ||
    !response.assets ||
    response.assets?.length === 0
  ) {
    return;
  }

  let image = response.assets[0];
  if (image.fileSize > IMAGE_SIZE_LIMIT) {
    ToastEvent.show({
      title: 'File too large',
      message: 'The maximum allowed size per image is 50 MB',
      type: 'error'
    });
    return;
  }
  let b64 = `data:${image.type};base64, ` + image.base64;
  let uri = image.uri;
  uri = decodeURI(uri);
  console.log(uri);
  let hash = await Sodium.hashFile({
    uri: uri,
    type: 'url'
  });
  tiny.call(
    EditorWebView,
    `
	  (function(){
		let image = ${JSON.stringify({
      hash: hash,
      type: image.type,
      filename: image.fileName,
      dataurl: b64,
      size: image.fileSize
    })}
		
    editor.undoManager.transact(function() {
      tinymce.activeEditor.execCommand('mceAttachImage',image);
      setTimeout(function() {
        tinymce.activeEditor.nodeChanged({selectionChange:true})
      },100)
     }); 
	  })();
	  `
  );
  attachFile(uri, hash, image.type, image.fileName, 'image');
};

async function attachFile(uri, hash, type, filename) {
  try {
    let exists = db.attachments.exists(hash);
    let encryptionInfo;
    if (!exists) {
      let key = await db.attachments.generateKey();
      encryptionInfo = await Sodium.encryptFile(key, {
        uri: uri,
        type: 'url',
        hash: hash
      });
      encryptionInfo.type = type;
      encryptionInfo.filename = filename;
      encryptionInfo.alg = `xcha-stream`;
      encryptionInfo.size = encryptionInfo.length;
      encryptionInfo.key = key;
    } else {
      encryptionInfo = {hash: hash};
    }

    console.log(encryptionInfo);
    await db.attachments.add(encryptionInfo, getNote()?.id);
    if (Platform.OS === 'ios') await RNFetchBlob.fs.unlink(uri);

    return true;
  } catch (e) {
    console.log('attach file error: ', e);
    if (Platform.OS === 'ios') {
      await RNFetchBlob.fs.unlink(uri);
    }
    return false;
  }
}

export default {
  file,
  pick
};
