import React, {createRef, useEffect, useState} from 'react';
import {ActivityIndicator, Platform, View} from 'react-native';
import DocumentPicker from 'react-native-document-picker';
import {FlatList} from 'react-native-gesture-handler';
import {useTracked} from '../../provider';
import {initialize} from '../../provider/stores';
import {
  eSubscribeEvent,
  eUnSubscribeEvent,
  ToastEvent
} from '../../services/EventManager';
import {db} from '../../utils/database';
import {eCloseRestoreDialog, eOpenRestoreDialog} from '../../utils/Events';
import {SIZE} from '../../utils/SizeUtils';
import storage from '../../utils/storage';
import {sleep, timeConverter} from '../../utils/TimeUtils';
import ActionSheetWrapper from '../ActionSheetComponent/ActionSheetWrapper';
import {Button} from '../Button';
import DialogHeader from '../Dialog/dialog-header';
import Seperator from '../Seperator';
import Paragraph from '../Typography/Paragraph';

const actionSheetRef = createRef();
let RNFetchBlob;
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
    ToastEvent.show({
      heading: 'Restoring Backup',
      message: 'Your backup data is being restored. please wait.',
      type: 'error',
      context: 'local'
    });
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkBackups();
  }, []);

  const restore = async (item, index) => {
    if (restoring) {
      return;
    }
    if (Platform.OS === 'android') {
      let granted = storage.requestPermission();
      if (!granted) {
        ToastEvent.show({
          heading: 'Cannot restore backup',
          message: 'You must provide phone storage access to restore backups.',
          type: 'error',
          context: 'local'
        });
        return;
      }
    }
    try {
      setRestoring(true);
      let prefix = Platform.OS === 'ios' ? '' : 'file:/';
      let backup = await RNFetchBlob.fs.readFile(prefix + item.path, 'utf8');
      await db.backup.import(backup);
      setRestoring(false);
      initialize();
      ToastEvent.show({
        heading: 'Restore successful',
        message: 'Your backup data has been restored successfully.',
        type: 'success',
        context: 'global'
      });
      close();
    } catch (e) {
      setRestoring(false);
      ToastEvent.show({
        heading: 'Restore failed',
        message: e.message,
        type: 'error',
        context: 'local'
      });
    }
  };

  const checkBackups = async () => {
    if (Platform.OS === 'android') {
      let granted = await storage.requestPermission();
      if (!granted) {
        ToastEvent.show({
          heading: 'Backup check failed',
          message:
            'You must provide phone storage access to check for backups.',
          type: 'success',
          context: 'local'
        });
        return;
      }
    }
    RNFetchBlob = require('rn-fetch-blob').default;
    try {
      let path = await storage.checkAndCreateDir('/backups/');
      let files = await RNFetchBlob.fs.lstat(path);
      files = files.sort(function (a, b) {
        timeA = a.lastModified;
        timeB = b.lastModified;
        return timeB - timeA;
      });

      setFiles(files);
      setTimeout(() => {
        setLoading(false);
      }, 1000);
    } catch (e) {}
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
            paddingTop: restoring ? 8 : 0
          }}>
          <DialogHeader
            title="Backups"
            paragraph="All the backups are stored in 'Phone Storage/Notesnook/Backups'."
            button={{
              title: 'Open File Manager',
              onPress: () => {
                if (restoring) {
                  return;
                }
                DocumentPicker.pick()
                  .then(r => {
                    setRestoring(true);
                    fetch(r.uri).then(async r => {
                      try {
                        let backup = await r.json();

                        await db.backup.import(JSON.stringify(backup));
                        setRestoring(false);
                        initialize();

                        ToastEvent.show({
                          heading: 'Restore successful',
                          message:
                            'Your backup data has been restored successfully.',
                          type: 'success',
                          context: 'global'
                        });
                        actionSheetRef.current?.hide();
                      } catch (e) {
                        setRestoring(false);
                        ToastEvent.show({
                          heading: 'Restore failed',
                          message:
                            'The selected backup data file is invalid. You must select a *.nnbackup file to restore.',
                          type: 'error',
                          context: 'local'
                        });
                      }
                    });
                  })
                  .catch(console.log);
              }
            }}
          />
        </View>
        <Seperator half />
        <FlatList
          nestedScrollEnabled
          onScrollEndDrag={() => {
            actionSheetRef.current?.handleChildScrollEnd();
          }}
          onMomentumScrollEnd={() => {
            actionSheetRef.current?.handleChildScrollEnd();
          }}
          onScrollAnimationEnd={() => {
            actionSheetRef.current?.handleChildScrollEnd();
          }}
          ListEmptyComponent={
            !restoring ? (
              loading ? (
                <View
                  style={{
                    justifyContent: 'center',
                    alignItems: 'center',
                    height: 100
                  }}>
                  <ActivityIndicator color={colors.accent} size={SIZE.lg} />
                </View>
              ) : (
                <View
                  style={{
                    justifyContent: 'center',
                    alignItems: 'center',
                    height: 100
                  }}>
                  <Paragraph color={colors.icon}>No backups found.</Paragraph>
                </View>
              )
            ) : (
              <View
                style={{
                  justifyContent: 'center',
                  alignItems: 'center',
                  height: 200
                }}>
                <ActivityIndicator color={colors.accent} />
                <Paragraph color={colors.icon}>
                  Restoring backup. Please wait.
                </Paragraph>
              </View>
            )
          }
          keyExtractor={item => item.filename}
          style={{
            paddingHorizontal: 12
          }}
          data={restoring || loading ? [] : files}
          renderItem={({item, index}) => [
            <View
              style={{
                minHeight: 50,
                justifyContent: 'space-between',
                alignItems: 'center',
                width: '100%',
                borderRadius: 0,
                flexDirection: 'row',
                borderBottomWidth: 0.5,
                borderBottomColor: colors.nav
              }}>
              <View
                style={{
                  maxWidth: '75%'
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
          ]}
          ListFooterComponent={
            restoring || loading ? null : (
              <View
                style={{
                  height: 150
                }}
              />
            )
          }
        />
      </View>
    </>
  );
};
