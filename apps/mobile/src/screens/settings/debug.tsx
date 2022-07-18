import Clipboard from '@react-native-clipboard/clipboard';
import React from 'react';
import { FlatList, Platform, TouchableOpacity, View } from 'react-native';
import * as ScopedStorage from 'react-native-scoped-storage';
import RNFetchBlob from 'rn-fetch-blob';
import { presentDialog } from '../../components/dialog/functions';
import { IconButton } from '../../components/ui/icon-button';
import { Notice } from '../../components/ui/notice';
import Paragraph from '../../components/ui/typography/paragraph';
import { ToastEvent } from '../../services/event-manager';
import { useThemeStore } from '../../stores/use-theme-store';
import { hexToRGBA } from '../../utils/color-scheme/utils';
import Storage from '../../utils/database/storage';
import { sanitizeFilename } from '../../utils/sanitizer';

export default function DebugLogs() {
  const colors = useThemeStore(state => state.colors);

  const renderItem = ({ item, index }) => {
    const background =
      item.type === 'error'
        ? hexToRGBA(colors.red, 0.2)
        : item.type === 'success'
        ? hexToRGBA(colors.green, 0.2)
        : item.type === 'warn'
        ? hexToRGBA(colors.orange, 0.2)
        : 'transparent';

    const color =
      item.type === 'error'
        ? colors.red
        : item.type === 'success'
        ? colors.green
        : item.type === 'warn'
        ? colors.orange
        : 'transparent';

    return (
      <TouchableOpacity
        activeOpacity={1}
        onLongPress={() => {
          Clipboard.setString(item.error);
          ToastEvent.show({
            heading: 'Debug log copied!',
            context: 'global',
            type: 'success'
          });
        }}
        style={{
          paddingHorizontal: 12,
          paddingVertical: 12,
          backgroundColor: background,
          flexShrink: 1
        }}
      >
        <Paragraph
          style={{
            flexShrink: 1,
            flexWrap: 'wrap',
            fontFamily: 'monospace'
          }}
          color={color}
        >
          {item.error}
        </Paragraph>
      </TouchableOpacity>
    );
  };
  return (
    <View>
      <View
        style={{
          padding: 12
        }}
      >
        <Notice
          text="If you are facing an issue in the app. You can send us the logs from here to help us investigate the issue."
          type="information"
        />

        <View
          style={{
            flexDirection: 'row',
            width: '100%',
            alignItems: 'flex-end',
            justifyContent: 'flex-end',
            marginTop: 12
          }}
        >
          <IconButton
            onPress={() => {
              Clipboard.setString('All logs copied');
              ToastEvent.show({
                heading: 'Debug log copied!',
                context: 'global',
                type: 'success'
              });
            }}
            size={20}
            name="clipboard"
            color={colors.gray}
          />
          <IconButton
            onPress={async () => {
              try {
                let path = null;
                const fileName = sanitizeFilename(`notesnook_logs_${Date.now()}`);
                if (Platform.OS === 'android') {
                  let file = await ScopedStorage.createDocument(
                    fileName,
                    'text/plain',
                    'save data',
                    'utf8'
                  );
                  if (!file) return;
                  path = file.uri;
                } else {
                  path = await Storage.checkAndCreateDir('/');
                  await RNFetchBlob.fs.writeFile(path + fileName, 'save data', 'utf8');
                  path = path + fileName;
                }

                if (path) {
                  ToastEvent.show({
                    heading: 'Debug logs downloaded',
                    context: 'global',
                    type: 'success'
                  });
                }
              } catch (e) {
                console.log(e);
              }
            }}
            size={20}
            name="download"
            color={colors.gray}
          />

          <IconButton
            onPress={() => {
              presentDialog({
                title: 'Clear all logs',
                paragraph: 'Are you sure you want to delete alll logs?',
                negativeText: 'Cancel',
                positiveText: 'Clear',
                positivePress: () => {}
              });
            }}
            size={20}
            name="delete"
            color={colors.gray}
          />
        </View>
      </View>

      <FlatList
        inverted
        data={[
          {
            type: 'error',
            error: 'Error: file not found and jt aksdj adksj kdajkd jsakdjs kjda kdjsak djaks dkas.'
          },
          {
            type: 'warn',
            error: 'Warning: file found with invalid name'
          },
          {
            type: 'success',
            error: 'Success: file found'
          },
          {
            type: 'error',
            error: 'Error: file not found'
          }
        ]}
        renderItem={renderItem}
      />
    </View>
  );
}
