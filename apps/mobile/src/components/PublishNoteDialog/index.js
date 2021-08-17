import React, {useEffect, useRef, useState} from 'react';
import {
  ActivityIndicator,
  Clipboard,
  TouchableOpacity,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {useTracked} from '../../provider';
import {
  eSubscribeEvent,
  eUnSubscribeEvent,
  ToastEvent,
} from '../../services/EventManager';
import Navigation from '../../services/Navigation';
import {db} from '../../utils/DB';
import {
  eClosePublishNoteDialog,
  eOpenPublishNoteDialog,
} from '../../utils/Events';
import {openLinkInBrowser} from '../../utils/functions';
import {SIZE} from '../../utils/SizeUtils';
import {ActionIcon} from '../ActionIcon';
import ActionSheetWrapper from '../ActionSheetComponent/ActionSheetWrapper';
import {Button} from '../Button';
import DialogHeader from '../Dialog/dialog-header';
import Input from '../Input';
import Seperator from '../Seperator';
import Heading from '../Typography/Heading';
import Paragraph from '../Typography/Paragraph';

let passwordValue = null;
const PublishNoteDialog = () => {
  const [state] = useTracked();
  const colors = state.colors;
  const [visible, setVisible] = useState(false);
  const actionSheetRef = useRef();
  const [selfDestruct, setSelfDestruct] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [note, setNote] = useState(null);
  const [publishing, setPublishing] = useState(false);
  const publishUrl =
    note &&
    `https://monograph.notesnook.com/${db?.monographs.monograph(note?.id)}`;
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
          password: isLocked && passwordValue,
        });
        setNote(db.notes.note(note.id)?.data);
        Navigation.setRoutesToUpdate([
          Navigation.routeNames.Notes,
          Navigation.routeNames.NotesPage,
          Navigation.routeNames.Favorites,
        ]);
      }
    } catch (e) {
      ToastEvent.show({
        heading: 'Could not publish note',
        message: e.message,
        type: 'error',
        context: 'local',
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
        Navigation.setRoutesToUpdate([
          Navigation.routeNames.Notes,
          Navigation.routeNames.NotesPage,
          Navigation.routeNames.Favorites,
        ]);
      }
    } catch (e) {
      ToastEvent.show({
        heading: 'Could not unpublish note',
        message: e.message,
        type: 'error',
        context: 'local',
      });
    }
    actionSheetRef.current?.hide();
    setPublishing(false);
  };

  return !visible ? null : (
    <ActionSheetWrapper
      centered={false}
      fwdRef={actionSheetRef}
      closeOnTouchBackdrop={!publishing}
      onClose={async () => {
        passwordValue = null;
        setVisible(false);
      }}>
      <View
        style={{
          width: '100%',
          alignSelf: 'center',
          paddingHorizontal: 12,
        }}>
        <DialogHeader
          title="Publish note"
          paragraph={`Anyone with the link${
            isLocked ? ' and password' : ''
          } of a published note can view it.`}
        />

        {publishing ? (
          <View
            style={{
              justifyContent: 'center',
              alignContent: 'center',
              height: 150,
              width: '100%',
            }}>
            <ActivityIndicator size={25} color={colors.accent} />
            <Paragraph
              style={{
                textAlign: 'center',
              }}>
              Please wait...
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
                  backgroundColor: colors.shade,
                  padding: 10,
                  borderRadius: 5,
                  borderWidth: 1,
                  borderColor: colors.accent,
                }}>
                <View
                  style={{
                    width: '100%',
                    flexShrink: 1,
                  }}>
                  <Heading size={SIZE.md}>This Note is published</Heading>
                  <Paragraph numberOfLines={1}>{publishUrl}</Paragraph>

                  <Paragraph
                    onPress={async () => {
                      try {
                        await openLinkInBrowser(publishUrl, colors.accent);
                      } catch (e) {}
                    }}
                    style={{
                      marginTop: 5,
                      color: colors.accent,
                    }}>
                    <Icon name="open-in-new" /> Open in browser
                  </Paragraph>
                </View>

                <ActionIcon
                  onPress={() => {
                    Clipboard.setString(publishUrl);
                    ToastEvent.show({
                      heading: 'Note publish url copied',
                      type: 'success',
                      context: 'local',
                    });
                  }}
                  color={colors.icon}
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
                marginBottom: 10,
              }}>
              <ActionIcon
                onPress={() => {
                  if (publishing) return;
                  setIsLocked(!isLocked);
                }}
                color={isLocked ? colors.accent : colors.icon}
                size={SIZE.lg}
                name={
                  isLocked
                    ? 'check-circle-outline'
                    : 'checkbox-blank-circle-outline'
                }
              />

              <View
                style={{
                  width: '100%',
                  flexShrink: 1,
                }}>
                <Heading size={SIZE.md}>Password protection</Heading>
                <Paragraph>
                  Published note can only be viewed by someone with the
                  password.
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
                alignItems: 'center',
              }}>
              <ActionIcon
                onPress={() => {
                  setSelfDestruct(!selfDestruct);
                }}
                color={selfDestruct ? colors.accent : colors.icon}
                size={SIZE.lg}
                name={
                  selfDestruct
                    ? 'check-circle-outline'
                    : 'checkbox-blank-circle-outline'
                }
              />

              <View
                style={{
                  width: '100%',
                  flexShrink: 1,
                }}>
                <Heading size={SIZE.md}>Self destruct</Heading>
                <Paragraph>
                  Published note link will be automatically deleted once it is
                  viewed by someone.
                </Paragraph>
              </View>
            </TouchableOpacity>

            <View
              style={{
                width: '100%',
                alignSelf: 'center',
                marginTop: 10,
              }}>
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
          size={SIZE.xs + 1}
          style={{
            textAlign: 'center',
            marginTop: 5,
            textDecorationLine: 'underline',
          }}
          onPress={async () => {
            try {
              await openLinkInBrowser(
                'https://docs.notesnook.com/monographs/',
                colors.accent,
              );
            } catch (e) {}
          }}>
          Learn more about Notesnook Monograph
        </Paragraph>
      </View>
    </ActionSheetWrapper>
  );
};

export default PublishNoteDialog;
