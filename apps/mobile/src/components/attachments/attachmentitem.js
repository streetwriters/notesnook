import React, { useEffect, useState } from 'react';
import { TouchableOpacity, View } from 'react-native';
import * as Progress from 'react-native-progress';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTracked } from '../../provider';
import { useAttachmentStore } from '../../provider/stores';
import { db } from '../../utils/database';
import filesystem from '../../utils/filesystem';
import { SIZE } from '../../utils/size';
import SheetProvider from '../sheet-provider';
import { IconButton } from '../ui/icon-button';
import Paragraph from '../ui/typography/paragraph';

function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

function getFileExtension(filename) {
  var ext = /^.+\.([^.]+)$/.exec(filename);
  return ext == null ? '' : ext[1];
}

export const AttachmentItem = ({ attachment, encryption }) => {
  const [state] = useTracked();
  const colors = state.colors;
  const progress = useAttachmentStore(state => state.progress);
  const [currentProgress, setCurrentProgress] = useState(
    encryption
      ? {
          type: 'encrypt'
        }
      : null
  );
  const encryptionProgress = encryption
    ? useAttachmentStore(state => state.encryptionProgress)
    : null;

  const onPress = async () => {
    if (currentProgress) {
      db.fs.cancel(attachment.metadata.hash, 'download');
      useAttachmentStore.getState().remove(attachment.metadata.hash);
      return;
    }
    filesystem.downloadAttachment(attachment.metadata.hash, false);
  };

  useEffect(() => {
    let prog = progress[attachment.metadata.hash];
    if (prog) {
      let type = prog.type;
      let loaded = prog.type === 'download' ? prog.recieved : prog.sent;
      prog = loaded / prog.total;
      prog = (prog * 100).toFixed(0);
      console.log('progress: ', prog);
      console.log(prog);
      setCurrentProgress({
        value: prog,
        percent: prog + '%',
        type: type
      });
    } else {
      setCurrentProgress(null);
    }
  }, [progress]);

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
      type="grayBg"
    >
      <SheetProvider context={attachment.metadata.hash} />
      <View
        style={{
          flexShrink: 1,
          flexDirection: 'row',
          alignItems: 'center'
        }}
      >
        <View
          style={{
            justifyContent: 'center',
            alignItems: 'center',
            marginLeft: -5
          }}
        >
          <Icon name="file" size={SIZE.xxxl} color={colors.icon} />

          <Paragraph
            adjustsFontSizeToFit
            size={6}
            color={colors.light}
            style={{
              position: 'absolute'
            }}
          >
            {getFileExtension(attachment.metadata.filename).toUpperCase()}
          </Paragraph>
        </View>

        <View
          style={{
            flexShrink: 1,
            marginLeft: 10
          }}
        >
          <Paragraph
            size={SIZE.sm - 1}
            style={{
              flexWrap: 'wrap',
              marginBottom: 2.5
            }}
            numberOfLines={1}
            lineBreakMode="middle"
            color={colors.pri}
          >
            {attachment.metadata.filename}
          </Paragraph>

          <Paragraph color={colors.icon} size={SIZE.xs}>
            {formatBytes(attachment.length)}{' '}
            {currentProgress?.type ? '(' + currentProgress.type + 'ing - tap to cancel)' : ''}
          </Paragraph>
        </View>
      </View>

      {currentProgress || encryptionProgress || encryption ? (
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => {
            if (encryption) return;
            db.fs.cancel(attachment.metadata.hash);
            setCurrentProgress(null);
          }}
          style={{
            justifyContent: 'center',
            marginLeft: 5,
            marginTop: 5,
            marginRight: -5
          }}
        >
          <Progress.Circle
            size={SIZE.xxl}
            progress={
              encryptionProgress
                ? encryptionProgress
                : currentProgress?.value
                ? currentProgress?.value / 100
                : 0
            }
            showsText
            textStyle={{
              fontSize: 10
            }}
            color={colors.accent}
            formatText={progress => (progress * 100).toFixed(0)}
            borderWidth={0}
            thickness={2}
          />
        </TouchableOpacity>
      ) : (
        <IconButton
          onPress={() => !encryption && onPress(attachment)}
          name="download"
          size={SIZE.lg}
          color={colors.pri}
        />
      )}
    </View>
  );
};
