import React, {useCallback, useEffect} from 'react';
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

export const Folders = ({route, navigation}) => {
  const [state, dispatch] = useTracked();
  const {notebooks} = state;
  let pageIsLoaded = false;

  const onFocus = useCallback(() => {
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
        placeholderData={{
          heading: 'Your Notebooks',
          paragraph: 'You have not added any notebooks yet.',
          button: 'Add a Notebook',
          action: _onPressBottomButton,
        }}
        headerProps={{
          heading: "Notebooks",
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
