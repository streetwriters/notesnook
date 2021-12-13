import {Linking} from 'react-native';
import {InAppBrowser} from 'react-native-inappbrowser-reborn';
import {history} from '.';
import {useMenuStore, useSelectionStore} from '../provider/stores';
import {eSendEvent, ToastEvent} from '../services/EventManager';
import Navigation from '../services/Navigation';
import {db} from './database';
import {eClearEditor} from './Events';

export const deleteItems = async item => {
  if (item && db.monographs.isPublished(item.id)) {
    ToastEvent.show({
      heading: 'Can not delete note',
      message: 'Unpublish note to delete it',
      type: 'error',
      context: 'global'
    });
    return;
  }
  if (item && item.id && history.selectedItemsList.length === 0) {
    history.selectedItemsList = [];
    history.selectedItemsList.push(item);
  }

  let notes = history.selectedItemsList.filter(i => i.type === 'note');
  let notebooks = history.selectedItemsList.filter(i => i.type === 'notebook');
  let topics = history.selectedItemsList.filter(i => i.type === 'topic');

  if (notes?.length > 0) {
    let ids = notes
      .map(i => {
        if (db.monographs.isPublished(i.id)) {
          ToastEvent.show({
            heading: 'Some notes are published',
            message: 'Unpublish published notes to delete them',
            type: 'error',
            context: 'global'
          });
          return null;
        }
        return i.id;
      })
      .filter(n => n !== null);

    await db.notes.delete(...ids);
    Navigation.setRoutesToUpdate([
      Navigation.routeNames.Notes,
      Navigation.routeNames.NotesPage
    ]);
    eSendEvent(eClearEditor);
  }
  if (topics?.length > 0) {
    for (var i = 0; i < topics.length; i++) {
      let it = topics[i];
      await db.notebooks.notebook(it.notebookId).topics.delete(it.id);
    }
    Navigation.setRoutesToUpdate([
      Navigation.routeNames.Notebooks,
      Navigation.routeNames.Notebook
    ]);
    useMenuStore.getState().setMenuPins();
    ToastEvent.show({
      heading: 'Topics deleted',
      type: 'success'
    });
  }

  if (notebooks?.length > 0) {
    let ids = notebooks.map(i => i.id);
    await db.notebooks.delete(...ids);
    Navigation.setRoutesToUpdate([
      Navigation.routeNames.Notebooks,
      Navigation.routeNames.Notes
    ]);
    useMenuStore.getState().setMenuPins();
  }

  let msgPart = history.selectedItemsList.length === 1 ? ' item' : ' items';
  let message = history.selectedItemsList.length + msgPart + ' moved to trash.';

  let itemsCopy = [...history.selectedItemsList];
  if (topics.length === 0 && (notes.length > 0 || notebooks.length > 0)) {
    ToastEvent.show({
      heading: message,
      type: 'success',
      func: async () => {
        let trash = db.trash.all;
        let ids = [];
        for (var i = 0; i < itemsCopy.length; i++) {
          let it = itemsCopy[i];
          let trashItem = trash.find(item => item.id === it.id);
          ids.push(trashItem.id);
        }
        await db.trash.restore(...ids);
        Navigation.setRoutesToUpdate([
          Navigation.routeNames.Notebooks,
          Navigation.routeNames.Notes,
          Navigation.routeNames.Trash,
          Navigation.routeNames.NotesPage,
          Navigation.routeNames.Notebook,
          Navigation.routeNames.Trash
        ]);
        useMenuStore.getState().setMenuPins();
        useMenuStore.getState().setColorNotes();
        ToastEvent.hide();
      },
      actionText: 'Undo'
    });
  }
  history.selectedItemsList = [];
  Navigation.setRoutesToUpdate([Navigation.routeNames.Trash]);
  useSelectionStore.getState().clearSelection();
  useMenuStore.getState().setMenuPins();
  useMenuStore.getState().setColorNotes();
};

export const openLinkInBrowser = async (link, colors) => {
  try {
    const url = link;
    if (await InAppBrowser.isAvailable()) {
      await InAppBrowser.open(url, {
        // iOS Properties
        dismissButtonStyle: 'cancel',
        preferredBarTintColor: colors.accent,
        preferredControlTintColor: 'white',
        readerMode: false,
        animated: true,
        modalPresentationStyle: 'fullScreen',
        modalTransitionStyle: 'coverVertical',
        modalEnabled: true,
        enableBarCollapsing: false,
        // Android Properties
        showTitle: true,
        toolbarColor: colors.accent,
        secondaryToolbarColor: 'black',
        enableUrlBarHiding: true,
        enableDefaultShare: true,
        forceCloseOnRedirection: false
      });
    } else Linking.openURL(url);
  } catch (error) {
    console.log(error.message);
  }
};
