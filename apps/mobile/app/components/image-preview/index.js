import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import ImageViewer from 'react-native-image-zoom-viewer';
import { eSubscribeEvent, eUnSubscribeEvent } from '../../services/event-manager';
import BaseDialog from '../dialog/base-dialog';
import { IconButton } from '../ui/icon-button';

const ImagePreview = () => {
  const [visible, setVisible] = useState(false);
  const [image, setImage] = useState('');

  useEffect(() => {
    eSubscribeEvent('ImagePreview', open);

    return () => {
      eUnSubscribeEvent('ImagePreview', open);
    };
  }, []);

  const open = image => {
    setImage(image);
    setVisible(true);
  };

  const close = () => {
    setImage(null);
    setVisible(false);
  };

  return (
    visible && (
      <BaseDialog animation="slide" visible={true} onRequestClose={close}>
        <View
          style={{
            width: '100%',
            height: '100%',
            backgroundColor: 'black'
          }}
        >
          <ImageViewer
            enableImageZoom={true}
            renderIndicator={() => <></>}
            enableSwipeDown
            useNativeDriver
            onSwipeDown={close}
            saveToLocalByLongPress={false}
            renderHeader={() => (
              <View
                style={{
                  flexDirection: 'row',
                  width: '100%',
                  justifyContent: 'flex-end',
                  alignItems: 'center',
                  height: 80,
                  marginTop: 0,
                  paddingHorizontal: 12,
                  position: 'absolute',
                  zIndex: 999,
                  backgroundColor: 'rgba(0,0,0,0.3)',
                  paddingTop: 30
                }}
              >
                <IconButton
                  name="close"
                  color="white"
                  onPress={() => {
                    close();
                  }}
                />
              </View>
            )}
            imageUrls={[
              {
                url: image
              }
            ]}
          />
        </View>
      </BaseDialog>
    )
  );
};

export default ImagePreview;
