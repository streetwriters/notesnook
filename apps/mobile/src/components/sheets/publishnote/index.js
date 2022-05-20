import Clipboard from '@react-native-clipboard/clipboard';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useThemeStore } from '../../../stores/use-theme-store';
import { useAttachmentStore } from '../../../stores/use-attachment-store';
import { eSubscribeEvent, eUnSubscribeEvent, ToastEvent } from '../../../services/event-manager';
import Navigation from '../../../services/navigation';
import { db } from '../../../utils/database';
import { eClosePublishNoteDialog, eOpenPublishNoteDialog } from '../../../utils/events';
import { openLinkInBrowser } from '../../../utils/functions';
import { SIZE } from '../../../utils/size';
import DialogHeader from '../../dialog/dialog-header';
import { Button } from '../../ui/button';
import { IconButton } from '../../ui/icon-button';
import Input from '../../ui/input';
import Seperator from '../../ui/seperator';
import SheetWrapper from '../../ui/sheet';
import Heading from '../../ui/typography/heading';
import Paragraph from '../../ui/typography/paragraph';
import SearchService from '../../../services/search';

let passwordValue = null;
const PublishNoteSheet = () => {
  const colors = useThemeStore(state => state.colors);
  const [visible, setVisible] = useState(false);
  const actionSheetRef = useRef();
  const loading = useAttachmentStore(state => state.loading);
  const [selfDestruct, setSelfDestruct] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [note, setNote] = useState(null);
  const [publishing, setPublishing] = useState(false);
  const publishUrl =
    note && `https://monograph.notesnook.com/${db?.monographs.monograph(note?.id)}`;
  const isPublished = note && db?.monographs.isPublished(note?.id);
  const pwdInput = useRef();

  useEffect(() => {
    eSubscribeEvent(eOpenPublishNoteDialog, open);
    eSubscribeEvent(eClosePublishNoteDialog, close);
    return () => {
      eUnSubscribeEvent(eOpenPublishNoteDialog, open);
      eUnSubscribeEvent(eClosePublishNoteDialog, close);
    };
  }, []);

  const open = item => {
    setNote(item);
    setPublishing(false);
    setSelfDestruct(false);
    setIsLocked(false);
    setVisible(true);
    passwordValue = null;
  };

  useEffect(() => {
    if (visible) {
      actionSheetRef.current?.show();
    }
  }, [visible]);

  const close = () => {
    passwordValue = null;
    actionSheetRef.current?.hide();
  };

  const publishNote = async () => {
    if (publishing) return;
    setPublishing(true);

    try {
      if (note?.id) {
        if (isLocked && !passwordValue) return;
        await db.monographs.publish(note.id, {
          selfDestruct: selfDestruct,
          password: isLocked && passwordValue
        });
        setNote(db.notes.note(note.id)?.data);
        Navigation.queueRoutesForUpdate(
          'Notes',
          'Favorites',
          'ColoredNotes',
          'TaggedNotes',
          'TopicNotes'
        );
      }
    } catch (e) {
      ToastEvent.show({
        heading: 'Could not publish note',
        message: e.message,
        type: 'error',
        context: 'local'
      });
    }

    setPublishing(false);
  };

  const deletePublishedNote = async () => {
    if (publishing) return;
    setPublishing(true);
    try {
      if (note?.id) {
        await db.monographs.unpublish(note.id);
        setNote(db.notes.note(note.id)?.data);
        Navigation.queueRoutesForUpdate(
          'Notes',
          'Favorites',
          'ColoredNotes',
          'TaggedNotes',
          'TopicNotes'
        );
      }
    } catch (e) {
      ToastEvent.show({
        heading: 'Could not unpublish note',
        message: e.message,
        type: 'error',
        context: 'local'
      });
    }
    actionSheetRef.current?.hide();
    setPublishing(false);
  };

  return !visible ? null : (
    <SheetWrapper
      centered={false}
      fwdRef={actionSheetRef}
      closeOnTouchBackdrop={!publishing}
      gestureEnabled={!publishing}
      onClose={async () => {
        passwordValue = null;
        setVisible(false);
      }}
    >
      <View
        style={{
          width: '100%',
          alignSelf: 'center',
          paddingHorizontal: 12
        }}
      >
        <DialogHeader
          title={note.title}
          paragraph={`Anyone with the link${
            isLocked ? ' and password' : ''
          } of the published note can view it.`}
        />

        {publishing ? (
          <View
            style={{
              justifyContent: 'center',
              alignContent: 'center',
              height: 150,
              width: '100%'
            }}
          >
            <ActivityIndicator size={25} color={colors.accent} />
            <Paragraph
              style={{
                textAlign: 'center'
              }}
            >
              Please wait...
              {loading && `\nDownloading attachments (${loading?.current / loading?.total})`}
            </Paragraph>
          </View>
        ) : (
          <>
            {isPublished && (
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  marginTop: 15,
                  backgroundColor: colors.nav,
                  padding: 12,
                  borderRadius: 5
                }}
              >
                <View
                  style={{
                    width: '100%',
                    flexShrink: 1
                  }}
                >
                  <Heading size={SIZE.sm}>Published at:</Heading>
                  <Paragraph size={SIZE.xs} numberOfLines={1}>
                    {publishUrl}
                  </Paragraph>
                  <Paragraph
                    onPress={async () => {
                      try {
                        await openLinkInBrowser(publishUrl, colors.accent);
                      } catch (e) {}
                    }}
                    size={SIZE.xs}
                    style={{
                      marginTop: 5,
                      color: colors.pri
                    }}
                  >
                    <Icon color={colors.accent} name="open-in-new" /> Open in browser
                  </Paragraph>
                </View>

                <IconButton
                  onPress={() => {
                    Clipboard.setString(publishUrl);
                    ToastEvent.show({
                      heading: 'Note publish url copied',
                      type: 'success',
                      context: 'local'
                    });
                  }}
                  color={colors.accent}
                  size={SIZE.lg}
                  name="content-copy"
                />
              </View>
            )}
            <Seperator />

            <TouchableOpacity
              onPress={() => {
                if (publishing) return;
                setIsLocked(!isLocked);
              }}
              activeOpacity={0.9}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginBottom: 10
              }}
            >
              <IconButton
                onPress={() => {
                  if (publishing) return;
                  setIsLocked(!isLocked);
                }}
                color={isLocked ? colors.accent : colors.icon}
                size={SIZE.lg}
                name={isLocked ? 'check-circle-outline' : 'checkbox-blank-circle-outline'}
              />

              <View
                style={{
                  width: '100%',
                  flexShrink: 1
                }}
              >
                <Heading size={SIZE.md}>Password protection</Heading>
                <Paragraph>
                  Published note can only be viewed by someone with the password.
                </Paragraph>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                setSelfDestruct(!selfDestruct);
              }}
              activeOpacity={0.9}
              style={{
                flexDirection: 'row',
                alignItems: 'center'
              }}
            >
              <IconButton
                onPress={() => {
                  setSelfDestruct(!selfDestruct);
                }}
                color={selfDestruct ? colors.accent : colors.icon}
                size={SIZE.lg}
                name={selfDestruct ? 'check-circle-outline' : 'checkbox-blank-circle-outline'}
              />

              <View
                style={{
                  width: '100%',
                  flexShrink: 1
                }}
              >
                <Heading size={SIZE.md}>Self destruct</Heading>
                <Paragraph>
                  Published note link will be automatically deleted once it is viewed by someone.
                </Paragraph>
              </View>
            </TouchableOpacity>

            <View
              style={{
                width: '100%',
                alignSelf: 'center',
                marginTop: 10
              }}
            >
              {isLocked ? (
                <>
                  <Input
                    fwdRef={pwdInput}
                    onChangeText={value => (passwordValue = value)}
                    blurOnSubmit
                    secureTextEntry
                    defaultValue={passwordValue}
                    placeholder="Enter Password"
                  />
                  <Seperator half />
                </>
              ) : null}

              <Button
                onPress={publishNote}
                fontSize={SIZE.md}
                width="100%"
                style={{
                  marginTop: 10
                }}
                height={50}
                type="accent"
                title={isPublished ? 'Update published note' : 'Publish note'}
              />

              {isPublished && (
                <>
                  <Seperator half />
                  <Button
                    onPress={deletePublishedNote}
                    fontSize={SIZE.md}
                    width="100%"
                    height={50}
                    type="error"
                    title="Unpublish note"
                  />
                </>
              )}
            </View>
          </>
        )}

        <Paragraph
          color={colors.icon}
          size={SIZE.xs}
          style={{
            textAlign: 'center',
            marginTop: 5,
            textDecorationLine: 'underline'
          }}
          onPress={async () => {
            try {
              await openLinkInBrowser('https://docs.notesnook.com/monographs/', colors.accent);
            } catch (e) {}
          }}
        >
          Learn more about Notesnook Monograph
        </Paragraph>
      </View>
    </SheetWrapper>
  );
};

export default PublishNoteSheet;
