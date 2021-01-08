import React, {useCallback, useEffect, useState} from 'react';
import {AddNotebookEvent} from '../../components/DialogManager/recievers';
import {Placeholder} from '../../components/ListPlaceholders';
import SimpleList from '../../components/SimpleList';
import {NotebookItemWrapper} from '../../components/SimpleList/NotebookItemWrapper';
import {useTracked} from '../../provider';
import {Actions} from '../../provider/Actions';
import {ContainerBottomButton} from '../../components/Container/ContainerBottomButton';
import {eSendEvent} from '../../services/EventManager';
import SearchService from '../../services/SearchService';
import {eScrollEvent} from '../../utils/Events';
import Navigation from '../../services/Navigation';
import {DDS} from '../../services/DeviceDetection';
import {InteractionManager} from 'react-native';

export const Folders = ({route, navigation}) => {
  const [state, dispatch] = useTracked();
  const notebooks = state.notebooks;
  const [loading, setLoading] = useState(true);
  let pageIsLoaded = false;

  const onFocus = useCallback(() => {
    InteractionManager.runAfterInteractions(() => {
      if (loading) {
        setLoading(false);
      }
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
    });

    if (!pageIsLoaded) {
      pageIsLoaded = true;
      return;
    }
    Navigation.setHeaderState(
      'notebooks',
      {
        menu: true,
      },
      {
        heading: 'Notebooks',
        id: 'notebooks_navigation',
      },
    );
  }, []);

  useEffect(() => {
    navigation.addListener('focus', onFocus);
    return () => {
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

  const updateSearch = () => {
    SearchService.update({
      placeholder: 'Type a keyword to search in notebooks',
      data: notebooks,
      type: 'notebooks',
      title:"Notebooks"
    });
  };

  const _onPressBottomButton = () => AddNotebookEvent();

  return (
    <>
      <SimpleList
        data={notebooks}
        type="notebooks"
        focused={() => navigation.isFocused()}
        RenderItem={NotebookItemWrapper}
        loading={loading}
        placeholderData={{
          heading: 'Your Notebooks',
          paragraph: 'You have not added any notebooks yet.',
          button: 'Add a Notebook',
          action: _onPressBottomButton,
          loading: 'Loading your notebooks',
        }}
        headerProps={{
          heading: 'Notebooks',
        }}
        placeholder={<Placeholder type="notebooks" />}
      />

      {!notebooks || notebooks.length === 0 ? null : (
        <ContainerBottomButton
          title="Create a new notebook"
          onPress={_onPressBottomButton}
        />
      )}
    </>
  );
};

export default Folders;
