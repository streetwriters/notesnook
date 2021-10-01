import React, {useEffect, useRef, useState} from 'react';
import {Platform, ScrollView, Text, View} from 'react-native';
import {FlatList} from 'react-native-gesture-handler';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {useTracked} from '../../provider';
import {useAttachmentStore} from '../../provider/stores';
import {
  eSubscribeEvent,
  eUnSubscribeEvent,
  ToastEvent
} from '../../services/EventManager';
import {db} from '../../utils/DB';
import {
  eCloseAttachmentDialog,
  eCloseTagsDialog,
  eOpenAttachmentsDialog,
  eOpenTagsDialog
} from '../../utils/Events';
import {SIZE} from '../../utils/SizeUtils';
import {sleep} from '../../utils/TimeUtils';
import {ActionIcon} from '../ActionIcon';
import ActionSheetWrapper from '../ActionSheetComponent/ActionSheetWrapper';
import DialogHeader from '../Dialog/dialog-header';
import {PressableButton} from '../PressableButton';
import Heading from '../Typography/Heading';
import Paragraph from '../Typography/Paragraph';
import * as Progress from 'react-native-progress';
import filesystem from '../../utils/filesystem';
import * as ScopedStorage from 'react-native-scoped-storage';
import RNFetchBlob from 'rn-fetch-blob';
import Sodium from 'react-native-sodium';
import Storage from '../../utils/storage';

export const AttachmentDialog = () => {
  const [state] = useTracked();
  const colors = state.colors;
  const [visible, setVisible] = useState(false);
  const [note, setNote] = useState(null);
  const actionSheetRef = useRef();
  const [attachments, setAttachments] = useState([]);

  useEffect(() => {
    eSubscribeEvent(eOpenAttachmentsDialog, open);
    eSubscribeEvent(eCloseAttachmentDialog, close);
    return () => {
      eUnSubscribeEvent(eOpenAttachmentsDialog, open);
      eUnSubscribeEvent(eCloseAttachmentDialog, close);
    };
  }, [visible]);

  const open = item => {
    setNote(item);
    setVisible(true);
    let _attachments = db.attachments.get(item.id);
    setAttachments(_attachments);
  };

  useEffect(() => {
    if (visible) {
      actionSheetRef.current?.show();
    }
  }, [visible]);

  const close = () => {
    actionSheetRef.current?.hide();
    setVisible(false);
  };

  return !visible ? null : (
    <ActionSheetWrapper
      centered={false}
      fwdRef={actionSheetRef}
      onClose={async () => {
        setVisible(false);
      }}>
      <View
        style={{
          width: '100%',
          alignSelf: 'center',
          paddingHorizontal: 12
        }}>
        <DialogHeader title="Attachments" />
        <FlatList
          nestedScrollEnabled
          overScrollMode="never"
          scrollToOverflowEnabled={false}
          keyboardDismissMode="none"
          keyboardShouldPersistTaps="always"
          onMomentumScrollEnd={() => {
            actionSheetRef.current?.handleChildScrollEnd();
          }}
          ListEmptyComponent={
            <View
              style={{
                height: 150,
                justifyContent: 'center',
                alignItems: 'center'
              }}>
              <Icon name="attachment" size={60} color={colors.icon} />
              <Paragraph>No attachments on this note</Paragraph>
            </View>
          }
          data={attachments}
          renderItem={({item, index}) => (
            <Attachment attachment={item} note={note} setNote={setNote} />
          )}
        />

        <Paragraph
          color={colors.icon}
          size={SIZE.xs}
          style={{
            textAlign: 'center',
            marginTop: 10
          }}>
          <Icon name="shield-key-outline" size={SIZE.xs} color={colors.icon} />
          {'  '}All attachments are end-to-end encrypted.
        </Paragraph>
      </View>
    </ActionSheetWrapper>
  );
};

function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

let icons = {
  image: 'image',
  file: 'file',
  pdf: 'file-pdf-box',
  video: 'file-video-outline',
  audio: 'file-music-outline'
};

function getIcon(type) {
  let types = type.split('/');
  let icon = Object.keys(icons).find(
    i => i.includes(types[0]) || i.includes(types[1])
  );
  return icons[icon] || 'file';
}

const Attachment = ({attachment, note, setNote}) => {
  const [state] = useTracked();
  const colors = state.colors;
  const progress = useAttachmentStore(state => state.progress);
  const setProgress = useAttachmentStore(state => state.setProgress);


  const onPress = async attachment => {
    if (getProgress()) {
      db.fs.cancel(attachment.metadata.hash, 'download');
      setProgress(0, 0, attachment.metadata.hash, 0, 'download', false);
      return;
    }

    let folder = {};
    if (Platform.OS === 'android') {
      let uris = await ScopedStorage.getPersistedUriPermissions();
      if (uris.length === 0) {
        folder = await ScopedStorage.openDocumentTree();
      } else {
        folder = {
          uri: uris[0]
        };
      }
    } else {
      folder.uri = await Storage.checkAndCreateDir('/Downloads/');
    }

    try {
      await db.fs.downloadFile(
        attachment.metadata.hash,
        attachment.metadata.hash
      );
      db.attachments;
      let key = await db.user.getEncryptionKey();
      await Sodium.decryptFile(key, {
        iv: attachment.iv,
        salt: attachment.salt,
        length: attachment.length,
        alg: attachment.alg,
        hash: attachment.hash,
        hashType: attachment.hashType,
        mime: attachment.metadata.type,
        fileName: attachment.metadata.filename,
        uri: folder.uri
      });
    } catch (e) {
      setProgress(0, 0, attachment.metadata.hash, 0, 'download', false);
    }
  };

  const getProgress = attachment => {
    let prog = progress[attachment.metadata.hash];
    if (prog && prog.type === 'download') {
      prog = prog.recieved / prog.total;
      prog = (prog * 100).toFixed(0);

      return {
        value: prog,
        percent: prog + '%'
      };
    } else {
      return null;
    }
  };

  return (
    <View
      style={{
        flexDirection: 'row',
        marginVertical: 5,
        justifyContent: 'space-between',
        padding: 12,
        paddingVertical: 6,
        borderRadius: 5,
        backgroundColor: colors.nav
      }}
      type="grayBg">
      <View
        style={{
          flexShrink: 1,
          flexDirection: 'row',
          alignItems: 'center'
        }}>
        <Icon
          name={getIcon(attachment.metadata.type)}
          size={SIZE.lg}
          color={colors.pri}
        />
        <View
          style={{
            flexShrink: 1,
            marginLeft: 10
          }}>
          <Paragraph
            size={SIZE.sm - 1}
            style={{
              flexWrap: 'wrap',
              marginBottom: 2.5
            }}
            numberOfLines={1}
            lineBreakMode="middle"
            color={colors.pri}>
            {attachment.metadata.filename}
          </Paragraph>

          <Paragraph color={colors.icon} size={SIZE.xs}>
            {formatBytes(attachment.length)} ({attachment.metadata.type})
          </Paragraph>
        </View>
      </View>

      {getProgress(attachment) ? (
        <View
          style={{
            justifyContent: 'center',
            marginLeft: 5
          }}>
          <Progress.Circle
            size={SIZE.xxl}
            progress={getProgress(attachment).value / 100}
            showsText
            textStyle={{
              fontSize: 9
            }}
            color={colors.accent}
            formatText={progress => (progress * 100).toFixed(0)}
            borderWidth={0}
            thickness={2}
          />
        </View>
      ) : (
        <ActionIcon
          onPress={() => onPress(attachment)}
          name="download"
          size={SIZE.lg}
          color={colors.pri}
        />
      )}
    </View>
  );
};
