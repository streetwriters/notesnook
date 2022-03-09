import React, { useCallback, useEffect } from 'react';
import { ContainerHeader } from '../../components/container/containerheader';
import { FloatingButton } from '../../components/container/floating-button';
import { AddNotebookEvent } from '../../components/dialog-provider/recievers';
import { Header } from '../../components/header';
import List from '../../components/list';
import SelectionHeader from '../../components/selection-header';
import { Walkthrough } from '../../components/walkthroughs';
import { useNotebookStore } from '../../stores/stores';
import Navigation from '../../services/navigation';
import SearchService from '../../services/search';
import { InteractionManager } from '../../utils';

export const Notebooks = ({ navigation }) => {
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
      } else {
        Walkthrough.update('notebooks');
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
      <ContainerHeader>
        <Header title="Notebooks" isBack={false} screen="Notebooks" action={_onPressBottomButton} />
      </ContainerHeader>
      <List
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
        <FloatingButton title="Create a new notebook" onPress={_onPressBottomButton} />
      )}
    </>
  );
};

export default Notebooks;
