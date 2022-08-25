import React from 'react';
import { View } from 'react-native';
import Editor from '../../screens/editor';
import EditorOverlay from '../../screens/editor/loading';
import { editorController } from '../../screens/editor/tiptap/utils';
import { eSendEvent, ToastEvent } from '../../services/event-manager';
import Navigation from '../../services/navigation';
import { useEditorStore } from '../../stores/use-editor-store';
import { useThemeStore } from '../../stores/use-theme-store';
import { db } from '../../common/database';
import { eCloseProgressDialog, eOnLoadNote } from '../../utils/events';
import DialogHeader from '../dialog/dialog-header';
import { Button } from '../ui/button';
import Paragraph from '../ui/typography/paragraph';

export default function NotePreview({ session, content }) {
  const colors = useThemeStore(state => state.colors);
  const editorId = ':noteHistory';

  async function restore() {
    await db.noteHistory.restore(session.id);
    if (useEditorStore.getState()?.currentEditingNote === session?.noteId) {
      if (editorController.current?.note) {
        eSendEvent(eOnLoadNote, { ...editorController.current?.note, forced: true });
      }
    }
    eSendEvent(eCloseProgressDialog, 'note_history');
    eSendEvent(eCloseProgressDialog);
    Navigation.queueRoutesForUpdate(
      'Notes',
      'Favorites',
      'ColoredNotes',
      'TaggedNotes',
      'TopicNotes'
    );

    ToastEvent.show({
      heading: 'Note restored successfully',
      type: 'success'
    });
  }

  return (
    <View
      style={{
        height: session.locked ? null : 600,
        width: '100%'
      }}
    >
      <DialogHeader padding={12} title={session.session} />
      {!session.locked ? (
        <>
          <EditorOverlay editorId={editorId} />
          <Editor
            noHeader
            noToolbar
            readonly
            editorId={editorId}
            onLoad={() => {
              const note = db.notes.note(session.noteId)?.data;
              eSendEvent(eOnLoadNote + editorId, {
                ...note,
                content: {
                  ...content,
                  isPreview: true
                }
              });
            }}
          />
        </>
      ) : (
        <View
          style={{
            width: '100%',
            height: 100,
            justifyContent: 'center',
            alignItems: 'center'
          }}
        >
          <Paragraph color={colors.icon}>Preview not available, content is encrypted.</Paragraph>
        </View>
      )}

      <View
        style={{
          paddingHorizontal: 12
        }}
      >
        <Button onPress={restore} title="Restore this version" type="accent" width="100%" />
      </View>
    </View>
  );
}
