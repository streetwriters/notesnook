import React, { createRef, useEffect, useState } from 'react';
import { ActivityIndicator, Platform, ScrollView, View } from 'react-native';
import DocumentPicker from 'react-native-document-picker';
import RNFetchBlob from 'rn-fetch-blob';
import { useTracked } from '../../provider';
import { Actions } from '../../provider/Actions';
import {
  eSubscribeEvent,
  eUnSubscribeEvent,
  ToastEvent
} from '../../services/EventManager';
import { db } from '../../utils/DB';
import { eCloseRestoreDialog, eOpenRestoreDialog } from '../../utils/Events';
import { SIZE } from '../../utils/SizeUtils';
import storage from '../../utils/storage';
import { sleep, timeConverter } from '../../utils/TimeUtils';
import ActionSheetWrapper from '../ActionSheetComponent/ActionSheetWrapper';
import { Button } from '../Button';
import DialogHeader from '../Dialog/dialog-header';
import Seperator from '../Seperator';
import { Toast } from '../Toast';
import Paragraph from '../Typography/Paragraph';

const actionSheetRef = createRef();

const RestoreDialog = () => {
  const [visible, setVisible] = useState(false);
  const [restoring, setRestoring] = useState(false);
  useEffect(() => {
    eSubscribeEvent(eOpenRestoreDialog, open);
    eSubscribeEvent(eCloseRestoreDialog, close);
    return () => {
      eUnSubscribeEvent(eOpenRestoreDialog, open);
      eUnSubscribeEvent(eCloseRestoreDialog, close);
    };
  }, []);

  const open = async () => {
    setVisible(true);
    await sleep(30);
    actionSheetRef.current?.setModalVisible(true);
  };

  const close = () => {
    if (restoring) {
      showIsWorking();
      return;
    }
    setVisible(false);
  };

  const showIsWorking = () => {
    ToastEvent.show(
      'Please wait, we are restoring your data.',
      'error',
      'local',
    );
  };

  return !visible ? null : (
    <ActionSheetWrapper
      fwdRef={actionSheetRef}
      gestureEnabled={!restoring}
      closeOnTouchBackdrop={!restoring}
      onClose={close}>
      <RestoreDataComponent
        close={close}
        restoring={restoring}
        setRestoring={setRestoring}
      />
    </ActionSheetWrapper>
  );
};

export default RestoreDialog;

const RestoreDataComponent = ({close, setRestoring, restoring}) => {
  const [state, dispatch] = useTracked();
  const {colors} = state;
  const [files, setFiles] = useState([]);

  useEffect(() => {
    checkBackups();
  }, []);

  const restore = async (item, index) => {
    if (restoring) {
      showIsWorking();
      return;
    }
    if (Platform.OS === 'android') {
      let granted = storage.requestPermission();
      if (!granted) {
        ToastEvent.show(
          'Restore Failed! Storage access denied',
          'error',
          'local',
        );
        return;
      }
    }
    try {
      setRestoring(true);
      let backup = await RNFetchBlob.fs.readFile('file:/' + item.path, 'utf8');
      await db.backup.import(backup);
      setRestoring(false);
      dispatch({type: Actions.ALL});
      ToastEvent.show('Restore Complete!', 'success', 'local');
      close();
    } catch (e) {
      setRestoring(false);
      ToastEvent.show(e.message, 'error', 'local');
      console.log(e);
    }
  };

  const checkBackups = async () => {
    if (Platform.OS === 'android') {
      let granted = await storage.requestPermission();
      if (!granted) {
        ToastEvent.show(
          'Storage permission required to check for backups.',
          'error',
        );
        return;
      }
    }
    try {
      let path = await storage.checkAndCreateDir('/backups/');
      let files = await RNFetchBlob.fs.lstat(path);
      files = files.sort(function (a, b) {
        timeA = a.lastModified;
        timeB = b.lastModified;
        return timeB - timeA;
      });

      setFiles(files);
    } catch (e) {
      console.log(e);
    }
  };

  return (
    <>
      <View>
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            paddingHorizontal: 8,
            paddingRight: 8,
            alignItems: 'center',
            paddingTop: restoring ? 25 : 0,
          }}>
          <DialogHeader
            title="Backups"
            paragraph="All the backups are stored in 'Phone Storage/Notesnook/Backups'."
            button={{
              title: 'Open File Manager',
              onPress: () => {
                if (restoring) {
                  showIsWorking();
                  return;
                }
                DocumentPicker.pick()
                  .then((r) => {
                    fetch(r.uri).then(async (r) => {
                      try {
                        let backup = await r.json();
                        setRestoring(true);
                        await db.backup.import(JSON.stringify(backup));
                        setRestoring(false);
                        dispatch({type: Actions.ALL});
                        ToastEvent.show(
                          'Restore Complete!',
                          'success',
                          'global',
                        );
                        setVisible(false);
                      } catch (e) {
                        setRestoring(false);
                        ToastEvent.show(
                          'Invalid backup data',
                          'error',
                          'local',
                        );
                      }
                    });
                  })
                  .catch(console.log);
              },
            }}
          />
        </View>

        <Seperator half />

        <ScrollView
          nestedScrollEnabled
          onScrollEndDrag={() => {
            actionSheetRef.current?.childScrollHandler();
          }}
          onMomentumScrollEnd={() => {
            actionSheetRef.current?.childScrollHandler();
          }}
          onScrollAnimationEnd={() => {
            actionSheetRef.current?.childScrollHandler();
          }}
          style={{
            paddingHorizontal: 12,
          }}>
          {files && files.length > 0 ? null : (
            <View
              style={{
                justifyContent: 'center',
                alignItems: 'center',
                height: 100,
              }}>
              <Paragraph color={colors.icon}>No backups found.</Paragraph>
            </View>
          )}

          {!restoring ? null : (
            <View
              style={{
                justifyContent: 'center',
                alignItems: 'center',
              }}>
              <ActivityIndicator color={colors.accent} />
              <Paragraph color={colors.icon}>
                Restoring backup. Please wait.
              </Paragraph>

              <Button
                title="Cancel"
                type="accent"
                onPress={() => {
                  setRestoring(false);
                }}
                height={25}
                style={{
                  marginTop: 5,
                }}
              />
            </View>
          )}

          {files.map((item, index) => (
            <View
              style={{
                minHeight: 50,
                justifyContent: 'space-between',
                alignItems: 'center',
                width: '100%',
                borderRadius: 0,
                flexDirection: 'row',
                borderBottomWidth: 0.5,
                borderBottomColor: colors.nav,
              }}>
              <View
                style={{
                  maxWidth: '75%',
                }}>
                <Paragraph
                  size={SIZE.sm}
                  style={{width: '100%', maxWidth: '100%'}}>
                  {timeConverter(item?.lastModified * 1)}
                </Paragraph>
                <Paragraph size={SIZE.xs}>
                  {item.filename.replace('.nnbackup', '')}
                </Paragraph>
              </View>
              <Button
                title="Restore"
                width={80}
                height={30}
                onPress={() => restore(item, index)}
              />
            </View>
          ))}
          <View
            style={{
              height: 25,
            }}
          />
        </ScrollView>
      </View>
      <Toast context="local" />
    </>
  );
};
