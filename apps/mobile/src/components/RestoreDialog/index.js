import React, {useEffect, useState} from 'react';
import {FlatList, Platform, Text, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import RNFetchBlob from 'rn-fetch-blob';
import {useTracked} from '../../provider';
import {Actions} from '../../provider/Actions';
import {
  eSubscribeEvent,
  eUnSubscribeEvent,
  ToastEvent,
} from '../../services/EventManager';
import {eCloseRestoreDialog, eOpenRestoreDialog} from '../../utils/Events';
import storage from '../../utils/storage';
import {getElevation} from '../../utils';
import {ActionIcon} from '../ActionIcon';
import {Button} from '../Button';
import BaseDialog from '../Dialog/base-dialog';
import {Loading} from '../Loading';
import {sleep} from '../../utils/TimeUtils';
import {ph, SIZE, WEIGHT} from '../../utils/SizeUtils';
import {db} from '../../utils/DB';
import {DDS} from '../../services/DeviceDetection';
import DialogHeader from '../Dialog/dialog-header';
import DialogButtons from '../Dialog/dialog-buttons';

const RestoreDialog = () => {
  const [state, dispatch] = useTracked();
  const {colors, tags, premiumUser} = state;
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
    setVisible(false);
  };

  const restore = async (item, index) => {
    if (Platform.OS === 'android') {
      let granted = storage.requestPermission();
      if (!granted) {
        ToastEvent.show('Restore Failed! Storage access denied');
        return;
      }
    }
    setRestoring(true);
    let backup = await RNFetchBlob.fs.readFile('file:/' + item.path, 'utf8');
    await db.backup.import(backup);
    await sleep(2000);
    setRestoring(false);
    console.log(db.notes.all);
    dispatch({type: Actions.ALL});
    ToastEvent.show('Restore Complete!', 'success');
    setVisible(false);
  };

  const checkBackups = async () => {
    if (Platform.OS === 'android') {
      let granted = await storage.requestPermission();
      if (!granted) {
        ToastEvent.show('Storage permission required to check for backups.');
        return;
      }
    }
    let path = await storage.checkAndCreateDir('/backups/');
    let files = await RNFetchBlob.fs.lstat(path);
    console.log(files);
    setFiles(files);
  };

  return (
    <BaseDialog
      animation="slide"
      visible={visible}
      onShow={checkBackups}
      onRequestClose={close}>
      <View
        style={{
          ...getElevation(5),
          width: DDS.isTab ? 500 : '80%',
          height: DDS.isTab ? 500 : null,
          maxHeight: '90%',
          borderRadius: 5,
          backgroundColor: colors.bg,
          padding: 12,
        }}>
        <BaseDialog visible={restoring}>
          <View
            style={{
              ...getElevation(5),
              width: '80%',
              maxHeight: 350,
              borderRadius: 5,
              backgroundColor: colors.bg,
              paddingHorizontal: ph,
              paddingVertical: 20,
            }}>
            <Loading height={40} tagline="Resoring your data" />
            <Text
              style={{
                fontFamily: WEIGHT.regular,
                alignSelf: 'center',
                textAlign: 'center',
                color: colors.icon,
                fontSize: SIZE.xs,
              }}>
              Your data is being restored
            </Text>
          </View>
        </BaseDialog>

        <DialogHeader
          title="Choose a Backup"
          paragraph="All backups are stored in 'Phone Storage/Notesnook/backups'
        folder."
        />

        <View
          style={{
            maxHeight: '85%',
          }}>
          <FlatList
            data={files}
            keyExtractor={(item, index) => item.filename}
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
                <Text
                  style={{
                    fontFamily: WEIGHT.regular,
                    fontSize: SIZE.xs + 1,
                    color: colors.pri,
                  }}>
                  {item.filename
                    .replace('notesnook_backup_', '')
                    .replace('.nnbackup', '')}
                </Text>

                <Button
                  title="Restore"
                  width={80}
                  height={30}
                  onPress={() => restore(item, index)}
                />
              </View>
            )}
          />
        </View>
        <DialogButtons onPressNegative={close} />
      </View>
    </BaseDialog>
  );
};

export default RestoreDialog;
