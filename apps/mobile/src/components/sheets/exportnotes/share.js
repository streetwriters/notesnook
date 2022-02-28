import React from 'react';
import { View } from 'react-native';
import FileViewer from 'react-native-file-viewer';
import Share from 'react-native-share';
import { ToastEvent } from '../../../services/EventManager';
import { SIZE } from '../../../utils/size';
import { Button } from '../../ui/button';

export const ShareComponent = ({ uri, name, padding }) => {
  return (
    <View
      style={{
        paddingHorizontal: padding
      }}
    >
      <Button
        title="Open"
        type="accent"
        width="100%"
        fontSize={SIZE.md}
        onPress={async () => {
          FileViewer.open(uri, {
            showOpenWithDialog: true,
            showAppsSuggestions: true
          }).catch(e => {
            ToastEvent.show({
              heading: 'Cannot open',
              message: `No application found to open ${name} file.`,
              type: 'success',
              context: 'local'
            });
          });
        }}
        height={50}
      />
      <Button
        title="Share"
        type="shade"
        width="100%"
        fontSize={SIZE.md}
        style={{
          marginTop: 10
        }}
        onPress={async () => {
          FileViewer.open(uri, {
            showOpenWithDialog: true,
            showAppsSuggestions: true,
            shareFile: true
          }).catch(console.log);
        }}
        height={50}
      />
    </View>
  );
};
