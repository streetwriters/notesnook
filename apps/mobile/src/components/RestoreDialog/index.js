import React, {useEffect, useState} from 'react';
import {FlatList, Platform, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import RNFetchBlob from 'rn-fetch-blob';
import {useTracked} from '../../provider';
import {Actions} from '../../provider/Actions';
import {DDS} from '../../services/DeviceDetection';
import {
  eSubscribeEvent,
  eUnSubscribeEvent,
  ToastEvent,
} from '../../services/EventManager';
import {getElevation} from '../../utils';
import {db} from '../../utils/DB';
import {eCloseRestoreDialog, eOpenRestoreDialog} from '../../utils/Events';
import {SIZE} from '../../utils/SizeUtils';
import storage from '../../utils/storage';
import {sleep} from '../../utils/TimeUtils';
import {Button} from '../Button';
import BaseDialog from '../Dialog/base-dialog';
import DialogButtons from '../Dialog/dialog-buttons';
import DialogHeader from '../Dialog/dialog-header';
import {Toast} from '../Toast';
import Paragraph from '../Typography/Paragraph';

const RestoreDialog = () => {
  const [state, dispatch] = useTracked();
  const {colors} = state;
  const [visible, setVisible] = useState(false);
  const [files, setFiles] = useState([]);
  const [restoring, setRestoring] = useState(false);
  const insets = useSafeAreaInsets();
  useEffect(() => {
    eSubscribeEvent(eOpenRestoreDialog, open);
    eSubscribeEvent(eCloseRestoreDialog, close);
    return () => {
      eUnSubscribeEvent(eOpenRestoreDialog, open);
      eUnSubscribeEvent(eCloseRestoreDialog, close);
    };
  }, []);

  const open = (data) => {
    setVisible(true);
  };

  const close = () => {
    if (restoring) {
      ToastEvent.show(
        'Please wait, we are restoring your data.',
        'error',
        'local',
      );
      return;
    }

    setVisible(false);
  };

  const restore = async (item, index) => {
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
    setRestoring(true);
    let backup = await RNFetchBlob.fs.readFile('file:/' + item.path, 'utf8');
    await db.backup.import(backup);
    await sleep(2000);
    setRestoring(false);
    dispatch({type: Actions.ALL});
    ToastEvent.show('Restore Complete!', 'success', 'local');
    setVisible(false);
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
    let path = await storage.checkAndCreateDir('/backups/');
    let files = await RNFetchBlob.fs.lstat(path);

    setFiles(files);
  };

  return !visible ? null : (
    <BaseDialog
      animation="slide"
      visible={true}
      onShow={checkBackups}
      onRequestClose={close}>
      <View
        style={{
          ...getElevation(5),
          paddingTop: insets.top + 10,
          width: DDS.isTab ? 500 : '100%',
          height: DDS.isTab ? 500 : '100%',
          maxHeight: DDS.isTab ? '90%' : '100%',
          borderRadius: 5,
          backgroundColor: colors.bg,
          padding: 12,
        }}>
        <DialogHeader
          title="Your Backups"
          paragraph="All backups stored in 'Phone Storage/Notesnook/backups'"
        />

        <FlatList
          data={files}
          style={{
            flexGrow: 1,
          }}
          keyExtractor={(item, index) => item.filename}
          ListEmptyComponent={
            <View
              style={{
                height: '100%',
                width: '100%',
                justifyContent: 'center',
                alignItems: 'center',
              }}>
              <Paragraph color={colors.icon}>No backups found.</Paragraph>
            </View>
          }
          renderItem={({item, index}) => (
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
              <Paragraph size={SIZE.sm} style={{width: '70%'}}>
                {item.filename}
              </Paragraph>

              <Button
                title="Restore"
                width={80}
                height={30}
                onPress={() => restore(item, index)}
              />
            </View>
          )}
        />

        <DialogButtons loading={restoring} onPressNegative={close} />
      </View>
      <Toast context="local" />
    </BaseDialog>
  );
};

export default RestoreDialog;
