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
import { eScrollEvent } from '../../utils/Events';


export const Folders = ({route, navigation}) => {
  const [state, dispatch] = useTracked();
  const {notebooks} = state;

  const onFocus = useCallback(() => {
    eSendEvent(eScrollEvent, {name: 'Notebooks', type: 'in'});
    dispatch({
      type: Actions.HEADER_STATE,
      state: true,
    });
    dispatch({
      type: Actions.HEADER_TEXT_STATE,
      state: {
        heading: 'Notebooks',
      },
    });

    dispatch({type: Actions.NOTEBOOKS});
    dispatch({
      type: Actions.CURRENT_SCREEN,
      screen: 'notebooks',
    });

    dispatch({
      type: Actions.CONTAINER_BOTTOM_BUTTON,
      state: {
        onPress:_onPressBottomButton
      },
    });

    updateSearch();
  }, [notebooks]);

  useEffect(() => {
    navigation.addListener('focus', onFocus);
    return () => {
      navigation.removeListener('focus', onFocus);
      eSendEvent(eScrollEvent, {name: 'Notebooks', type: 'back'});
    };
  },[]);

  useEffect(() => {
    if (navigation.isFocused()) {
      updateSearch();
    }
  }, [notebooks]);

  const updateSearch = () => {
    SearchService.update({
      placeholder: 'Search in notebooks',
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
