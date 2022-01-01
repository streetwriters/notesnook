import React, { useCallback, useEffect } from 'react';
import { ContainerBottomButton } from '../../components/Container/ContainerBottomButton';
import { ContainerTopSection } from '../../components/Container/ContainerTopSection';
import { presentDialog } from '../../components/Dialog/functions';
import { Header } from '../../components/Header';
import { Placeholder } from '../../components/ListPlaceholders';
import SelectionHeader from '../../components/SelectionHeader';
import SimpleList from '../../components/SimpleList';
import { useSelectionStore, useTrashStore } from '../../provider/stores';
import { eSendEvent, ToastEvent } from '../../services/EventManager';
import Navigation from '../../services/Navigation';
import SearchService from '../../services/SearchService';
import { InteractionManager } from '../../utils';
import { db } from '../../utils/database';
import { eScrollEvent } from '../../utils/Events';

export const Trash = ({route, navigation}) => {
  const trash = useTrashStore(state => state.trash);
  const setTrash = useTrashStore(state => state.setTrash);
  let pageIsLoaded = false;
  let ranAfterInteractions = false;

  const runAfterInteractions = () => {
    InteractionManager.runAfterInteractions(() => {
      Navigation.routeNeedsUpdate('Trash', () => {
        setTrash();
      });
    });

    console.log(trash);
    if (trash.length === 0) setTrash();

    updateSearch();
    ranAfterInteractions = false;
  };

  const onFocus = useCallback(() => {
    if (!pageIsLoaded) {
      pageIsLoaded = true;
      return;
    }
    if (!ranAfterInteractions) {
      ranAfterInteractions = true;
      runAfterInteractions();
    }
    Navigation.setHeaderState(
      'Trash',
      {
        menu: true,
      },
      {
        heading: 'Trash',
        id: 'trash_navigation',
      },
    );
  }, []);

  useEffect(() => {
    if (!ranAfterInteractions) {
      ranAfterInteractions = true;
      runAfterInteractions();
    }
    navigation.addListener('focus', onFocus);
    return () => {
      pageIsLoaded = false;
      ranAfterInteractions = false;
      navigation.removeListener('focus', onFocus);
    };
  }, []);

  useEffect(() => {
    if (navigation.isFocused()) {
      updateSearch();
    }
  }, [trash]);

  const updateSearch = () => {
    SearchService.update({
      placeholder: 'Search in trash',
      data: trash,
      type: 'trash',
      title: 'Trash',
    });
  };

  const _onPressBottomButton = () => {
    presentDialog({
      title: 'Clear trash',
      paragraph: 'Are you sure you want to clear the trash?',
      positiveText: 'Clear',
      negativeText: 'Cancel',
      positivePress: async () => {
        await db.trash.clear();
        useTrashStore.getState().setTrash();
        useSelectionStore.getState().clearSelection(true);
        ToastEvent.show({
          heading: 'Trash cleared',
          message:
            'All notes and notebooks in the trash have been removed permanantly.',
          type: 'success',
          context: 'local',
        });
      },
      positiveType: 'errorShade',
    });
  };

  return (
    <>
      <SelectionHeader screen="Trash" />
      <ContainerTopSection>
        <Header
          title="Trash"
          isBack={false}
          screen="Trash"
          action={_onPressBottomButton}
        />
      </ContainerTopSection>
      <SimpleList
        listData={trash}
        type="trash"
        screen="Trash"
        focused={() => navigation.isFocused()}
        placeholderData={{
          heading: 'Trash',
          paragraph:
            'Items in the trash will be permanently deleted after 7 days.',
          button: null,
          loading: 'Loading trash items',
        }}
        headerProps={{
          heading: 'Trash',
        }}
        placeholder={<Placeholder type="trash" />}
        placeholderText="Deleted notes & notebooks appear here."
      />

      {trash && trash.length !== 0 ? (
        <ContainerBottomButton
          title="Clear all trash"
          onPress={_onPressBottomButton}
          shouldShow={true}
        />
      ) : null}
    </>
  );
};

export default Trash;
