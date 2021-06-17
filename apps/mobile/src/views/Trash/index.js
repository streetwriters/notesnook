import React, { useCallback, useEffect } from 'react';
import { ContainerBottomButton } from '../../components/Container/ContainerBottomButton';
import { ContainerTopSection } from '../../components/Container/ContainerTopSection';
import { simpleDialogEvent } from '../../components/DialogManager/recievers';
import { TEMPLATE_EMPTY_TRASH } from '../../components/DialogManager/Templates';
import { Header } from '../../components/Header';
import { Placeholder } from '../../components/ListPlaceholders';
import SelectionHeader from '../../components/SelectionHeader';
import SimpleList from '../../components/SimpleList';
import { useTrashStore } from '../../provider/stores';
import { eSendEvent } from '../../services/EventManager';
import Navigation from '../../services/Navigation';
import SearchService from '../../services/SearchService';
import { InteractionManager } from '../../utils';
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

    eSendEvent(eScrollEvent, {name: 'Trash', type: 'in'});
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
      eSendEvent(eScrollEvent, {name: 'Trash', type: 'back'});
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

  const _onPressBottomButton = () => simpleDialogEvent(TEMPLATE_EMPTY_TRASH);

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

      {trash && trash.length !== 0 && (
        <ContainerBottomButton
          title="Clear all trash"
          onPress={_onPressBottomButton}
          shouldShow={true}
        />
      )}
    </>
  );
};

export default Trash;
