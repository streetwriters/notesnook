import React, {useEffect, useState} from 'react';
import {Linking} from 'react-native';
import {ScrollView} from 'react-native';
import {TextInput} from 'react-native';
import {Platform} from 'react-native';
import {View} from 'react-native';
import {useTracked} from '../../provider';
import {eSubscribeEvent, eUnSubscribeEvent} from '../../services/EventManager';
import {SIZE} from '../../utils/SizeUtils';
import {Button} from '../Button';
import BaseDialog from '../Dialog/base-dialog';
import DialogContainer from '../Dialog/dialog-container';
import Seperator from '../Seperator';
import Heading from '../Typography/Heading';
import Paragraph from '../Typography/Paragraph';

export const UpdateDialog = () => {
  const [state, dispatch] = useTracked();
  const {colors} = state;
  const [visible, setVisible] = useState(false);
  const [version, setVersion] = useState(null);

  const open = (version) => {
    setVersion(version);
    setVisible(true);
  };

  useEffect(() => {
    eSubscribeEvent('updateDialog', open);

    return () => {
      eUnSubscribeEvent('updateDialog', open);
    };
  });

  const format = (ver) => {
    let parts = ver.toString().split('');
    return `v${parts[0]}.${parts[1]}.${parts[2]}${
      parts[3] === '0' ? '' : parts[3]
    } `;
  };

  return (
    visible && (
      <BaseDialog
        onRequestClose={() => {
          setVisible(false);
        }}
        visible={true}>
        <DialogContainer>
          <View
            style={{
              justifyContent: 'center',
              alignItems: 'center',
            }}>
            <Heading>New Update Available!</Heading>
            <Paragraph
              style={{
                textAlign: 'center',
              }}
              size={SIZE.sm}>
              We recommend updating to the latest version to enjoy latest
              features and bug fixes.
            </Paragraph>
          </View>

          <View
            style={{
              minHeight: 50,
              borderRadius: 5,
              alignItems: 'center',
              marginTop: 10,
            }}>
            <ScrollView
              style={{
                width: '100%',
                backgroundColor: colors.nav,
                padding: 10,
                borderRadius: 5,
                maxHeight: 150,
              }}>
              <Paragraph
                style={{
                  fontFamily:
                    Platform.OS === 'ios' ? 'Courier New' : 'monospace',
                  fontWeight: 'bold',
                }}
                size={SIZE.sm}>
                Changelog {format(version.mobile)}
              </Paragraph>
              <Paragraph
                style={{
                  fontFamily:
                    Platform.OS === 'ios' ? 'Courier New' : 'monospace',
                }}
                size={SIZE.xs}>
                {version.mobile_changelog && version.mobile_changelog !== ''
                  ? version.mobile_changelog
                  : 'No changelog provided.'}
              </Paragraph>
              <View
                style={{
                  height: 25,
                }}
              />
            </ScrollView>
          </View>

          <Seperator />
          <Button
            title="Update Now"
            onPress={async () => {
              let url_android =
                'https://play.google.com/store/apps/details?id=com.streetwriters.notesnook';
              let url_ios = 'itms-apps://itunes.apple.com/app/id1544027013';
              setVisible(false);

              
              await Linking.openURL(
                Platform.OS === 'android' ? url_android : url_ios,
              );
            }}
            type="accent"
            width="100%"
            fontSize={SIZE.md}
            height={50}
          />
        </DialogContainer>
      </BaseDialog>
    )
  );
};
