import {history} from '.';
import {updateEvent} from '../components/DialogManager/recievers';
import {Actions} from '../provider/Actions';
import {eSendEvent, ToastEvent} from '../services/EventManager';
import {db} from './DB';
import {eClearEditor, eOnNewTopicAdded, eOpenPremiumDialog} from './Events';


export async function deleteItems(item) {
  if (item && item.dateCreated && history.selectedItemsList.length === 0) {
    history.selectedItemsList = [];
    history.selectedItemsList.push(item);
  }

  for (var i = 0; i < history.selectedItemsList.length; i++) {
    let it = history.selectedItemsList[i];
    if (it.type === 'note') {
      await db.notes.delete(it.id);
      updateEvent({type: it.type});
      eSendEvent(eClearEditor);
    } else if (it.type === 'topic') {
      await db.notebooks.notebook(it.notebookId).topics.delete(it.title);
      eSendEvent(eOnNewTopicAdded);
      updateEveny({type: 'notebook'});
      ToastEvent.show('Topics deleted', 'success');
    } else if (it.type === 'notebook') {
      await db.notebooks.delete(it.id);
      updateEvent({type: it.type});
    }
  }

  let msgPart = history.selectedItemsList.length === 1 ? ' item' : ' items';
  let message = history.selectedItemsList.length + msgPart + ' moved to trash.';

  let itemsCopy = [...history.selectedItemsList];
  if (history.selectedItemsList[0].type !== 'topic') {
    ToastEvent.show(
      message,
      'success',
      'global',
      6000,
      async () => {
        let trash = db.trash;

        for (var i = 0; i < itemsCopy.length; i++) {
          let it = itemsCopy[i];
          let trashItem = trash.all.find((item) => item.itemId === it.id);
          await db.trash.restore(trashItem.id);
         s
          updateEvent({type: it.type});
        }
        updateEvent({type: Actions.TRASH});
        ToastEvent.hide();
      },
      'Undo',
    );
  }
  updateEvent({type: Actions.CLEAR_SELECTION});
  updateEvent({type: Actions.SELECTION_MODE, enabled: false});
}
