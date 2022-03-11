import Clipboard from '@react-native-clipboard/clipboard';
import React, { useState } from 'react';
import { View } from 'react-native';
import picker from '../../screens/editor/tiny/toolbar/picker';
import { eSendEvent, presentSheet, ToastEvent } from '../../services/event-manager';
import PremiumService from '../../services/premium';
import { useAttachmentStore } from '../../stores/stores';
import { useThemeStore } from '../../stores/theme';
import { formatBytes } from '../../utils';
import { db } from '../../utils/database';
import { eCloseProgressDialog } from '../../utils/events';
import filesystem from '../../utils/filesystem';
import { useAttachmentProgress } from '../../utils/hooks/use-attachment-progress';
import { SIZE } from '../../utils/size';
import { Dialog } from '../dialog';
import { presentDialog } from '../dialog/functions';
import { DateMeta } from '../properties/date-meta';
import { Button } from '../ui/button';
import { Notice } from '../ui/notice';
import Heading from '../ui/typography/heading';
import Paragraph from '../ui/typography/paragraph';

const Actions = ({ attachment, setAttachments }) => {
  const colors = useThemeStore(state => state.colors);
  const contextId = attachment.metadata.hash;
  const [filename, setFilename] = useState(attachment.metadata.filename);
  const [currentProgress, setCurrentProgress] = useAttachmentProgress(attachment);
  const [failed, setFailed] = useState(attachment.failed);

  const actions = [
    {
      name: 'Download',
      onPress: async () => {
        if (currentProgress) {
          await db.fs.cancel(attachment.metadata.hash, 'download');
          useAttachmentStore.getState().remove(attachment.metadata.hash);
        }
        filesystem.downloadAttachment(attachment.metadata.hash, false);
        eSendEvent(eCloseProgressDialog, contextId);
      },
      icon: 'download'
    },
    {
      name: 'Reupload',
      onPress: async () => {
        if (!PremiumService.get()) {
          ToastEvent.show({
            heading: 'Upgrade to pro',
            type: 'error',
            context: 'local'
          });
          return;
        }
        await picker.pick({
          reupload: true,
          hash: attachment.metadata.hash,
          context: contextId,
          type: attachment.metadata.type
        });
      },
      icon: 'upload'
    },
    {
      name: 'Run file check',
      onPress: async () => {
        let res = await filesystem.checkAttachment(attachment.metadata.hash);
        if (res.failed) {
          db.attachments.markAsFailed(attachment.id, res.failed);
          setFailed(res.failed);
        }
      },
      icon: 'file-check'
    },
    {
      name: 'Rename',
      onPress: () => {
        presentDialog({
          context: contextId,
          input: true,
          title: 'Rename file',
          paragraph: 'Enter a new name for the file',
          defaultValue: attachment.metadata.filename,
          positivePress: async value => {
            if (value && value.length > 0) {
              await db.attachments.add({
                hash: attachment.metadata.hash,
                filename: value
              });
              setFilename(value);
              setAttachments([...db.attachments.all]);
            }
          },
          positiveText: 'Rename'
        });
      },
      icon: 'form-textbox'
    },
    {
      name: 'Delete',
      onPress: async () => {
        await db.attachments.remove(attachment.metadata.hash, false);
        setAttachments([...db.attachments.all]);
        eSendEvent(eCloseProgressDialog, contextId);
      },
      icon: 'delete-outline'
    }
  ];
  console.log(attachment);

  return (
    <View>
      <Dialog context={contextId} />
      <View
        style={{
          marginBottom: 12,
          borderBottomWidth: 1,
          borderBottomColor: colors.nav
        }}
      >
        <Heading
          style={{
            paddingHorizontal: 12
          }}
          size={SIZE.lg}
        >
          {filename}
        </Heading>

        <View
          style={{
            flexDirection: 'row',
            marginBottom: 10,
            paddingHorizontal: 12
          }}
        >
          <Paragraph
            size={SIZE.xs + 1}
            style={{
              marginRight: 10
            }}
            color={colors.icon}
          >
            {attachment.metadata.type}
          </Paragraph>
          <Paragraph
            style={{
              marginRight: 10
            }}
            size={SIZE.xs + 1}
            color={colors.icon}
          >
            {formatBytes(attachment.length)}
          </Paragraph>

          <Paragraph
            style={{
              marginRight: 10
            }}
            size={SIZE.xs + 1}
            color={colors.icon}
          >
            {attachment.noteIds.length} note{attachment.noteIds.length > 1 ? 's' : ''}
          </Paragraph>
          <Paragraph
            onPress={() => {
              Clipboard.setString(attachment.metadata.hash);
              ToastEvent.show({
                type: 'success',
                heading: 'Attachment hash copied',
                context: 'local'
              });
            }}
            size={SIZE.xs + 1}
            color={colors.icon}
          >
            {attachment.metadata.hash}
          </Paragraph>
        </View>

        <DateMeta item={attachment} />
      </View>

      {actions.map(item => (
        <Button
          key={item.name}
          buttonType={{
            text: item.on
              ? colors.accent
              : item.name === 'Delete' || item.name === 'PermDelete'
              ? colors.errorText
              : colors.pri
          }}
          onPress={item.onPress}
          title={item.name}
          icon={item.icon}
          type={item.on ? 'shade' : 'gray'}
          fontSize={SIZE.sm}
          style={{
            borderRadius: 0,
            justifyContent: 'flex-start',
            alignSelf: 'flex-start',
            width: '100%'
          }}
        />
      ))}

      <View
        style={{
          paddingHorizontal: 12
        }}
      >
        {failed ? (
          <Notice
            type="alert"
            text={`File check failed with error: ${attachment.failed} Try reuploading the file to fix the issue.`}
            size="small"
          />
        ) : null}
      </View>
    </View>
  );
};

Actions.present = (attachment, set, context) => {
  presentSheet({
    context: context,
    component: <Actions setAttachments={set} attachment={attachment} />
  });
};

export default Actions;
