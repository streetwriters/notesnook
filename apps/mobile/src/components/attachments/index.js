import React, { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { FlatList } from 'react-native-gesture-handler';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useThemeStore } from '../../stores/theme';
import { eSubscribeEvent, eUnSubscribeEvent } from '../../services/event-manager';
import { db } from '../../utils/database';
import { eCloseAttachmentDialog, eOpenAttachmentsDialog } from '../../utils/events';
import { SIZE } from '../../utils/size';
import DialogHeader from '../dialog/dialog-header';
import SheetWrapper from '../ui/sheet';
import Paragraph from '../ui/typography/paragraph';
import { AttachmentItem } from './attachment-item';
export const AttachmentDialog = () => {
  const colors = useThemeStore(state => state.colors);
  const [visible, setVisible] = useState(false);
  const [note, setNote] = useState(null);
  const actionSheetRef = useRef();
  const [attachments, setAttachments] = useState([]);

  useEffect(() => {
    eSubscribeEvent(eOpenAttachmentsDialog, open);
    eSubscribeEvent(eCloseAttachmentDialog, close);
    return () => {
      eUnSubscribeEvent(eOpenAttachmentsDialog, open);
      eUnSubscribeEvent(eCloseAttachmentDialog, close);
    };
  }, [visible]);

  const open = item => {
    setNote(item);
    setVisible(true);
    let _attachments = db.attachments.ofNote(item.id, 'all');
    setAttachments(_attachments);
  };

  useEffect(() => {
    if (visible) {
      actionSheetRef.current?.show();
    }
  }, [visible]);

  const close = () => {
    actionSheetRef.current?.hide();
    setVisible(false);
  };

  return !visible ? null : (
    <SheetWrapper
      centered={false}
      fwdRef={actionSheetRef}
      onClose={async () => {
        setVisible(false);
      }}
    >
      <View
        style={{
          width: '100%',
          alignSelf: 'center',
          paddingHorizontal: 12
        }}
      >
        <DialogHeader title="Attachments" />
        <FlatList
          nestedScrollEnabled
          overScrollMode="never"
          scrollToOverflowEnabled={false}
          keyboardDismissMode="none"
          keyboardShouldPersistTaps="always"
          onMomentumScrollEnd={() => {
            actionSheetRef.current?.handleChildScrollEnd();
          }}
          ListEmptyComponent={
            <View
              style={{
                height: 150,
                justifyContent: 'center',
                alignItems: 'center'
              }}
            >
              <Icon name="attachment" size={60} color={colors.icon} />
              <Paragraph>No attachments on this note</Paragraph>
            </View>
          }
          data={attachments}
          renderItem={({ item, index }) => (
            <AttachmentItem attachment={item} note={note} setNote={setNote} />
          )}
        />

        <Paragraph
          color={colors.icon}
          size={SIZE.xs}
          style={{
            textAlign: 'center',
            marginTop: 10
          }}
        >
          <Icon name="shield-key-outline" size={SIZE.xs} color={colors.icon} />
          {'  '}All attachments are end-to-end encrypted.
        </Paragraph>
      </View>
    </SheetWrapper>
  );
};
