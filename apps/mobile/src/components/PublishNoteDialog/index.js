import React, {useEffect, useRef, useState} from 'react';
import {
  Clipboard,
  Linking,
  Platform,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  eSubscribeEvent,
  eUnSubscribeEvent,
  ToastEvent,
} from '../../services/EventManager';
import {
  eClosePublishNoteDialog,
  eCloseRateDialog,
  eOpenPublishNoteDialog,
  eOpenRateDialog,
} from '../../utils/Events';
import {MMKV} from '../../utils/mmkv';
import {SIZE} from '../../utils/SizeUtils';
import ActionSheetWrapper from '../ActionSheetComponent/ActionSheetWrapper';
import {Button} from '../Button';
import DialogHeader from '../Dialog/dialog-header';
import Input from '../Input';
import Seperator from '../Seperator';
import Heading from '../Typography/Heading';
import Paragraph from '../Typography/Paragraph';

import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {ActionIcon} from '../ActionIcon';
import {useTracked} from '../../provider';
import {db} from '../../utils/DB';
import Navigation from '../../services/Navigation';
import {openLinkInBrowser} from '../../utils/functions';

let passwordValue = null;
const PublishNoteDialog = () => {
  const [state] = useTracked();
  const colors = state.colors;
  const [visible, setVisible] = useState(false);
  const actionSheetRef = useRef();
  const [selfDestruct, setSelfDestruct] = useState(true);
  const [isLocked, setIsLocked] = useState(false);
  const [note, setNote] = useState(null);
  const publishUrl = `https://monograph.notesnook.com/${note?.publishId}`;

  useEffect(() => {
    eSubscribeEvent(eOpenPublishNoteDialog, open);
    eSubscribeEvent(eClosePublishNoteDialog, close);
    return () => {
      eUnSubscribeEvent(eOpenPublishNoteDialog, open);
      eUnSubscribeEvent(eClosePublishNoteDialog, close);
    };
  }, []);

  const open = (item) => {
    setNote(item);
    setVisible(true);
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
    if (note?.id) {
      if (isLocked && !passwordValue) return;
      await db.monograph.update(note.id, {
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
  };

  const updateNote = async () => {
    if (note?.id) {
      if (isLocked && !passwordValue) return;
      await db.monograph.update(note.id, {
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
  };

  const deletePublishedNote = async () => {
    if (note?.id) {
      await db.monograph.unpublish(note.id);
      setNote(db.notes.note(note.id)?.data);
      Navigation.setRoutesToUpdate([
        Navigation.routeNames.Notes,
        Navigation.routeNames.NotesPage,
        Navigation.routeNames.Favorites,
      ]);
    }
  };

  return !visible ? null : (
    <ActionSheetWrapper
      centered={false}
      fwdRef={actionSheetRef}
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

        {note.publishId && (
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

        {isLocked ? (
          <Input
            onChangeText={value => (passwordValue = value)}
            blurOnSubmit
            secureTextEntry
            placeholder="Enter Password"
          />
        ) : (
          <Seperator />
        )}

        <TouchableOpacity
          onPress={() => {
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
            <Heading size={SIZE.md}>
              Password protection {isLocked ? 'enabled' : 'disabled'}
            </Heading>
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
            <Heading size={SIZE.md}>
              Self destruct {selfDestruct ? 'enabled' : 'disabled'}
            </Heading>
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
          <Button
            onPress={async () => {
              if (note.publishId) {
                updateNote();
              } else {
                publishNote();
              }
            }}
            fontSize={SIZE.md}
            width="100%"
            height={50}
            type="accent"
            title={note.publishId ? 'Update published note' : 'Publish note'}
          />

          {note.publishId && (
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
      </View>
    </ActionSheetWrapper>
  );
};

export default PublishNoteDialog;
