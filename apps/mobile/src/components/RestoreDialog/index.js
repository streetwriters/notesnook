import React, {useEffect, useState} from 'react';
import {FlatList, Text, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import RNFetchBlob from 'rn-fetch-blob';
import {ph, SIZE, WEIGHT} from '../../common/common';
import {useTracked} from '../../provider';
import {ACTIONS} from '../../provider/actions';
import {eSubscribeEvent, eUnSubscribeEvent} from '../../services/eventManager';
import {eCloseRestoreDialog, eOpenRestoreDialog} from '../../services/events';
import storage from '../../utils/storage';
import {
  db,
  getElevation,
  requestStoragePermission,
  sleep,
  ToastEvent,
} from '../../utils/utils';
import {Button} from '../Button';
import BaseDialog from '../Dialog/base-dialog';
import {Loading} from '../Loading';

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

  return (
    <BaseDialog
      animation="slide"
      visible={visible}
      onShow={async () => {
        let granted = await requestStoragePermission();
        if (!granted) {
          ToastEvent.show('Storage permission required to check for backups.');
          return;
        }
        await storage.checkAndCreateDir(
          RNFetchBlob.fs.dirs.SDCardDir + '/Notesnook/backups',
        );
        let files = await RNFetchBlob.fs.lstat(
          RNFetchBlob.fs.dirs.SDCardDir + '/Notesnook/backups',
        );
        console.log(files);
        setFiles(files);
      }}
      onRequestClose={close}>
      <View
        style={{
          ...getElevation(5),
          width: '100%',
          height: '100%',
          borderRadius: 5,
          backgroundColor: colors.bg,
          paddingHorizontal: 12,
          paddingVertical: 20,
          paddingTop: 0,
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

        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'center',
            height: 50,
            marginTop: insets.top,
          }}>
          <Icon
            name="close"
            size={SIZE.xxl}
            onPress={close}
            style={{
              width: 50,
              height: 50,
              position: 'absolute',
              textAlignVertical: 'center',
              left: 0,
              marginBottom: 15,
            }}
            color={colors.heading}
          />
          <Text
            style={{
              color: colors.accent,
              fontFamily: WEIGHT.bold,
              fontSize: SIZE.xl,
            }}>
            Choose a Backup
          </Text>
        </View>
        <Text
          style={{
            color: colors.icon,
            fontFamily: WEIGHT.regular,
            fontSize: SIZE.xs + 1,
            textAlign: 'center',
          }}>
          Phone Storage/Notesnook/backups/
        </Text>

        <FlatList
          data={files}
          style={{
            height: '100%',
          }}
          contentContainerStyle={{
            height: '100%',
          }}
          ListEmptyComponent={
            <View
              style={{
                width: '90%',
                height: '100%',
                justifyContent: 'center',
                alignItems: 'center',
                alignSelf: 'center',
              }}>
              <Text
                style={{
                  color: colors.pri,
                  fontFamily: WEIGHT.regular,
                  fontSize: SIZE.sm,
                  textAlign: 'center',
                  marginBottom: 10,
                }}>
                No Backups Found
              </Text>
              <Text
                style={{
                  color: colors.icon,
                  fontFamily: WEIGHT.regular,
                  fontSize: SIZE.xs + 1,
                  textAlign: 'center',
                }}>
                All backups are stored in 'Phone Storage/Notesnook/backups'
                folder. If you have migrated to a new device, move your backups
                to{' '}
                <Text style={{color: colors.accent}}>
                  'Phone Storage/Notesnook/backups'
                </Text>{' '}
                so they can be restored.
              </Text>
            </View>
          }
          renderItem={({item, index}) => (
            <View
              key={item.filename}
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
                }}>
                {item.filename
                  .replace('notesnook_backup_', '')
                  .replace('.nnbackup', '')}
              </Text>

              <Button
                title="Restore"
                width={80}
                height={30}
                onPress={async () => {
                  let granted = await requestStoragePermission();
                  if (!granted) {
                    ToastEvent.show(
                      'Restore Failed! Storage access denied',
                      'error',
                    );
                    return;
                  }
                  setRestoring(true);
                  let backup = await RNFetchBlob.fs.readFile(
                    'file:/' + item.path,
                    'utf8',
                  );
                  await db.backup.import(backup);
                  await sleep(2000);
                  setRestoring(false);
                  dispatch({type: ACTIONS.ALL});
                  ToastEvent.show('Restore Complete!', 'success');
                  setVisible(false);
                }}
              />
            </View>
          )}
        />
      </View>
    </BaseDialog>
  );
};

export default RestoreDialog;
