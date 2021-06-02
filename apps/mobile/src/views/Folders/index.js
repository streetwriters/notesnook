import React, {useCallback, useEffect, useState} from 'react';
import {AddNotebookEvent} from '../../components/DialogManager/recievers';
import {Placeholder} from '../../components/ListPlaceholders';
import SimpleList from '../../components/SimpleList';
import {useTracked} from '../../provider';
import {Actions} from '../../provider/Actions';
import {ContainerBottomButton} from '../../components/Container/ContainerBottomButton';
import {eSendEvent} from '../../services/EventManager';
import SearchService from '../../services/SearchService';
import {eScrollEvent} from '../../utils/Events';
import Navigation from '../../services/Navigation';
import {DDS} from '../../services/DeviceDetection';
import {InteractionManager} from '../../utils';
import {ContainerTopSection} from '../../components/Container/ContainerTopSection';
import {Header} from '../../components/Header';
import SelectionHeader from '../../components/SelectionHeader';
import {db} from '../../utils/DB';

export const Folders = ({route, navigation}) => {
  const [state, dispatch] = useTracked();
  const notebooks = state.notebooks;
  const [loading, setLoading] = useState(true);
  let pageIsLoaded = false;
  let ranAfterInteractions = false;

  const onFocus = useCallback(() => {
    if (!pageIsLoaded) {
      pageIsLoaded = true;
      return;
    }
    Navigation.setHeaderState(
      'Notebooks',
      {
        menu: true,
      },
      {
        heading: 'Notebooks',
        id: 'notebooks_navigation',
      },
    );
    if (!ranAfterInteractions) {
      ranAfterInteractions = true;
      runAfterInteractions();
    }
  }, []);

  const runAfterInteractions = () => {
    InteractionManager.runAfterInteractions(() => {
      if (loading) {
        setLoading(false);
      }
      Navigation.routeNeedsUpdate('Notebooks', () => {
        dispatch({type: Actions.NOTEBOOKS});
      });

      eSendEvent(eScrollEvent, {name: 'Notebooks', type: 'in'});
      updateSearch();
      if (DDS.isLargeTablet()) {
        dispatch({
          type: Actions.CONTAINER_BOTTOM_BUTTON,
          state: {
            onPress: _onPressBottomButton,
          },
        });
      }
      ranAfterInteractions = false;
    });
  };

  useEffect(() => {
    if (!ranAfterInteractions) {
      ranAfterInteractions = true;
      runAfterInteractions();
    }

    navigation.addListener('focus', onFocus);
    return () => {
      ranAfterInteractions = false;
      pageIsLoaded = false;
      navigation.removeListener('focus', onFocus);
      eSendEvent(eScrollEvent, {name: 'Notebooks', type: 'back'});
    };
  }, []);

  useEffect(() => {
    if (navigation.isFocused()) {
      updateSearch();
    }
  }, [notebooks]);

  const updateSearch = React.useCallback(() => {
    SearchService.update({
      placeholder: 'Type a keyword to search in notebooks',
      data: db.notebooks.all,
      type: 'notebooks',
      title: 'Notebooks',
    });
  }, []);

  const _onPressBottomButton = () => AddNotebookEvent();

  return (
    <>
      <SelectionHeader screen="Notebooks" />
      <ContainerTopSection>
        <Header
          title="Notebooks"
          isBack={false}
          screen="Notesbooks"
          action={_onPressBottomButton}
        />
      </ContainerTopSection>
      <SimpleList
        listData={state.notebooks}
        type="notebooks"
        screen="Notebooks"
        focused={() => navigation.isFocused()}
        loading={loading}
        placeholderData={{
          heading: 'Your notebooks',
          paragraph: 'You have not added any notebooks yet.',
          button: 'Add a notebook',
          action: _onPressBottomButton,
          loading: 'Loading your notebooks',
        }}
        headerProps={{
          heading: 'Notebooks',
        }}
        placeholder={<Placeholder type="notebooks" />}
      />

      {!state.notebooks || state.notebooks.length === 0 ? null : (
        <ContainerBottomButton
          title="Create a new notebook"
          onPress={_onPressBottomButton}
        />
      )}
    </>
  );
};

export default Folders;
