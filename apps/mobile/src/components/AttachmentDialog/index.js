import React, {useEffect, useRef, useState} from 'react';
import {ScrollView, Text, View} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {useTracked} from '../../provider';
import {eSubscribeEvent, eUnSubscribeEvent} from '../../services/EventManager';
import {eCloseTagsDialog, eOpenTagsDialog} from '../../utils/Events';
import {SIZE} from '../../utils/SizeUtils';
import ActionSheetWrapper from '../ActionSheetComponent/ActionSheetWrapper';
import DialogHeader from '../Dialog/dialog-header';
import {PressableButton} from '../PressableButton';
import Heading from '../Typography/Heading';
import Paragraph from '../Typography/Paragraph';

export const AttachmentDialog = () => {
  const [state] = useTracked();
  const colors = state.colors;
  const [visible, setVisible] = useState(false);
  const [note, setNote] = useState(null);
  const actionSheetRef = useRef();
  const [attachments, setAttachments] = useState([
    {
      name: 'my-file.png',
      length: 10000,
      type: 'text/pdf'
    }
  ]);

  useEffect(() => {
    eSubscribeEvent(eOpenTagsDialog, open);
    eSubscribeEvent(eCloseTagsDialog, close);
    return () => {
      eUnSubscribeEvent(eOpenTagsDialog, open);
      eUnSubscribeEvent(eCloseTagsDialog, close);
    };
  }, []);

  const open = item => {
    setNote(item);
    setVisible(true);
  };

  useEffect(() => {
    if (visible) {
      actionSheetRef.current?.show();
    }
  }, [visible]);

  const close = () => {
    actionSheetRef.current?.hide();
  };

  return visible ? null : (
    <ActionSheetWrapper
      centered={false}
      fwdRef={actionSheetRef}
      onClose={async () => {
        setVisible(false);
      }}>
      <View
        style={{
          width: '100%',
          alignSelf: 'center',
          paddingHorizontal: 12,
          minHeight: '60%'
        }}>
        <DialogHeader title="Attachments" />
        <ScrollView
          nestedScrollEnabled
          overScrollMode="never"
          scrollToOverflowEnabled={false}
          keyboardDismissMode="none"
          keyboardShouldPersistTaps="always"
          onMomentumScrollEnd={() => {
            actionSheetRef.current?.handleChildScrollEnd();
          }}>
          {attachments.map(item => (
            <Attachment attachment={item} note={note} setNote={setNote} />
          ))}
        </ScrollView>
      </View>
    </ActionSheetWrapper>
  );
};

function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

let icons = {
  image: 'image',
  file: 'file',
  pdf: 'file-pdf-box',
  video: 'file-video-outline',
  audio: 'file-music-outline'
};

function getIcon(type) {
  let types = type.split('/');
  let icon = Object.keys(icons).find(
    i => i.includes(types[0]) || i.includes(types[1])
  );
  return icons[icon] || 'file';
}

const Attachment = ({attachment, note, setNote}) => {
  const [state] = useTracked();
  const colors = state.colors;

  const onPress = async () => {};

  return (
    <PressableButton
      customStyle={{
        flexDirection: 'row',
        marginVertical: 5,
        justifyContent: 'space-between',
        padding: 12
      }}
      onPress={onPress}
      type="grayBg">
      <Text
        style={{
          flexWrap: 'wrap',
          flexShrink: 1
        }}>
        <Icon
          name={getIcon(attachment.type)}
          size={SIZE.md}
          color={colors.pri}
        />{' '}
        <Heading
          size={SIZE.sm}
          style={{
            flexWrap: 'wrap'
          }}
          color={colors.pri}>
          {attachment.name}
        </Heading>
        <Paragraph size={12}> ({formatBytes(attachment.length)})</Paragraph>
      </Text>

      <Icon name="download" size={SIZE.lg} color={colors.pri} />
    </PressableButton>
  );
};
