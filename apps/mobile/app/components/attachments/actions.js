import Clipboard from '@react-native-clipboard/clipboard';
import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import picker from '../../screens/editor/tiptap/picker';
import { eSendEvent, presentSheet, ToastEvent } from '../../services/event-manager';
import PremiumService from '../../services/premium';
import { useAttachmentStore } from '../../stores/use-attachment-store';
import { useThemeStore } from '../../stores/use-theme-store';
import { formatBytes } from '../../utils';
import { db } from '../../common/database';
import { eCloseAttachmentDialog, eCloseProgressDialog } from '../../utils/events';
import filesystem from '../../common/filesystem';
import { useAttachmentProgress } from '../../hooks/use-attachment-progress';
import { SIZE } from '../../utils/size';
import { sleep } from '../../utils/time';
import { Dialog } from '../dialog';
import { presentDialog } from '../dialog/functions';
import { openNote } from '../list-items/note/wrapper';
import { DateMeta } from '../properties/date-meta';
import { Button } from '../ui/button';
import { Notice } from '../ui/notice';
import { PressableButton } from '../ui/pressable';
import Heading from '../ui/typography/heading';
import Paragraph from '../ui/typography/paragraph';

const Actions = ({ attachment, setAttachments, fwdRef }) => {
  const colors = useThemeStore(state => state.colors);
  const contextId = attachment.metadata.hash;
  const [filename, setFilename] = useState(attachment.metadata.filename);
  const [currentProgress, setCurrentProgress] = useAttachmentProgress(attachment);
  const [failed, setFailed] = useState(attachment.failed);
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState({
    name: null
  });

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
        setLoading({
          name: 'Run file check'
        });
        let res = await filesystem.checkAttachment(attachment.metadata.hash);
        if (res.failed) {
          db.attachments.markAsFailed(attachment.id, res.failed);
          setFailed(res.failed);
        } else {
          setFailed(null);
          db.attachments.markAsFailed(attachment.id, null);
        }
        ToastEvent.show({
          heading: 'File check passed',
          type: 'success',
          context: 'local'
        });
        setAttachments([...db.attachments.all]);
        setLoading({
          name: null
        });
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

  const getNotes = () => {
    let allNotes = db.notes.all;
    let attachmentNotes = attachment.noteIds?.map(id => {
      let index = allNotes?.findIndex(note => id === note.id);
      if (index !== -1) {
        return allNotes[index];
      } else {
        return {
          type: 'notfound',
          title: `Note with id ${id} does not exist.`,
          id: id
        };
      }
    });
    return attachmentNotes;
  };

  useEffect(() => {
    setNotes(getNotes());
  }, [attachment]);

  return (
    <ScrollView
      onMomentumScrollEnd={() => {
        fwdRef?.current?.handleChildScrollEnd();
      }}
      nestedScrollEnabled={true}
      style={{
        maxHeight: '100%'
      }}
    >
      <Dialog context={contextId} />
      <View
        style={{
          borderBottomWidth: 1,
          borderBottomColor: colors.nav,
          marginBottom: notes && notes.length > 0 ? 0 : 12
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

      {notes && notes.length > 0 ? (
        <View
          style={{
            borderBottomWidth: 1,
            borderBottomColor: colors.nav,
            marginBottom: 12,
            paddingVertical: 12
          }}
        >
          <>
            <Heading
              style={{
                paddingHorizontal: 12
              }}
              size={SIZE.sm}
            >
              List of notes:
            </Heading>

            {notes.map(item => (
              <PressableButton
                onPress={async () => {
                  if (item.type === 'notfound') {
                    ToastEvent.show({
                      heading: 'Note not found',
                      message:
                        'A note with the given id was not found. Maybe you have deleted the note or moved it to trash already.',
                      type: 'error',
                      context: 'local'
                    });
                    return;
                  }
                  eSendEvent(eCloseProgressDialog, contextId);
                  await sleep(150);
                  eSendEvent(eCloseAttachmentDialog);
                  await sleep(300);
                  openNote(item, item.type === 'trash');
                }}
                customStyle={{
                  paddingVertical: 12,
                  alignItems: 'flex-start',

                  paddingHorizontal: 12
                }}
                key={item.id}
              >
                <Paragraph size={SIZE.xs + 1}>{item.title}</Paragraph>
              </PressableButton>
            ))}
          </>
        </View>
      ) : null}

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
          loading={loading?.name === item.name}
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
    </ScrollView>
  );
};

Actions.present = (attachment, set, context) => {
  presentSheet({
    context: context,
    component: ref => <Actions fwdRef={ref} setAttachments={set} attachment={attachment} />
  });
};

export default Actions;
