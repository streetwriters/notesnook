import React, { useCallback, useEffect } from 'react';
import { ContainerBottomButton } from '../../components/Container/ContainerBottomButton';
import { ContainerTopSection } from '../../components/Container/ContainerTopSection';
import { AddNotebookEvent } from '../../components/DialogManager/recievers';
import { Header } from '../../components/Header';
import { MoveNotes } from '../../components/MoveNoteDialog/movenote';
import SelectionHeader from '../../components/SelectionHeader';
import SimpleList from '../../components/SimpleList';
import { Walkthrough } from '../../components/Walkthrough';
import { useNotebookStore } from '../../provider/stores';
import Navigation from '../../services/Navigation';
import SearchService from '../../services/SearchService';
import { InteractionManager } from '../../utils';

export const Folders = ({ navigation }) => {
  const notebooks = useNotebookStore(state => state.notebooks);
  const setNotebooks = useNotebookStore(state => state.setNotebooks);
  let ranAfterInteractions = false;

  const onFocus = useCallback(() => {
    Navigation.setHeaderState(
      'Notebooks',
      {
        menu: true
      },
      {
        heading: 'Notebooks',
        id: 'notebooks_navigation'
      }
    );
    if (!ranAfterInteractions) {
      ranAfterInteractions = true;
      runAfterInteractions();
    }
  }, []);

  const runAfterInteractions = () => {
    InteractionManager.runAfterInteractions(() => {
      Navigation.routeNeedsUpdate('Notebooks', () => {
        setNotebooks();
      });
    });
    updateSearch();
    ranAfterInteractions = false;
  };

  useEffect(() => {
    navigation.addListener('focus', onFocus);
    return () => {
      ranAfterInteractions = false;
      navigation.removeListener('focus', onFocus);
    };
  }, []);

  useEffect(() => {
    if (navigation.isFocused()) {
      if (notebooks.length === 0) {
        Walkthrough.present('notebooks');
      }
      updateSearch();
    }
  }, [notebooks]);

  const updateSearch = React.useCallback(() => {
    SearchService.update({
      placeholder: 'Type a keyword to search in notebooks',
      data: notebooks,
      type: 'notebooks',
      title: 'Notebooks'
    });
  }, []);

  const _onPressBottomButton = () => {
    AddNotebookEvent();
  };

  return (
    <>
      <SelectionHeader screen="Notebooks" />
      <ContainerTopSection>
        <Header title="Notebooks" isBack={false} screen="Notebooks" action={_onPressBottomButton} />
      </ContainerTopSection>
      <SimpleList
        listData={notebooks}
        type="notebooks"
        screen="Notebooks"
        focused={() => navigation.isFocused()}
        placeholderData={{
          heading: 'Your notebooks',
          paragraph: 'You have not added any notebooks yet.',
          button: 'Add your first notebook',
          action: _onPressBottomButton,
          loading: 'Loading your notebooks'
        }}
        headerProps={{
          heading: 'Notebooks'
        }}
      />

      {!notebooks || notebooks.length === 0 ? null : (
        <ContainerBottomButton title="Create a new notebook" onPress={_onPressBottomButton} />
      )}
    </>
  );
};

export default Folders;
