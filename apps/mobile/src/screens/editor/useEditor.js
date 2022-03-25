import { db } from '../../utils/database';
import { useEditorStore } from '../../provider/stores';

async function save(id, data, sessionId) {
  let note = id ? db.notes.note(id).data : null;

  let noteId = await db.notes.add({
    id,
    ...data,
    sessionId
  });

  return noteId || id;
}

export const useEditor = ref => {
  const sessionId = useEditorStore(state => state.sessionId);

  const onMessage = event => {
    let message = event.nativeEvent.data;
    message = JSON.parse(message);

    console.log(message.type, message.value);

    if (message.sessionId !== sessionId) {
      console.log('useEditor: message recieved from invalid session', sessionId, message.sessionId);
      return;
    }
    switch (message.type) {
      case 'native:logger':
        console.log(message.type, message.value);
        return;
      case 'editor-event:content':
        return;
      case 'editor-event:selection':
        return;
      case 'editor-event:title':
        return;
    }
  };

  return { onMessage };
};
