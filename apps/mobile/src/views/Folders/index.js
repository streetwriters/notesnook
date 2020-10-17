import React, {useCallback, useEffect} from 'react';
import {AddNotebookEvent} from '../../components/DialogManager/recievers';
import {Placeholder} from '../../components/ListPlaceholders';
import SimpleList from '../../components/SimpleList';
import {NotebookItemWrapper} from '../../components/SimpleList/NotebookItemWrapper';
import {useTracked} from '../../provider';
import {Actions} from '../../provider/Actions';
import {ContainerBottomButton} from '../../components/Container/ContainerBottomButton';
import note from "notes-core/models/note";
import notebook from "notes-core/models/notebook";
export const Folders = ({route, navigation}) => {
  const [state, dispatch] = useTracked();
  const {notebooks} = state;
  const params = route.params;

  const onFocus = useCallback(() => {
    dispatch({
      type: Actions.HEADER_STATE,
      state: {
        type: 'notebooks',
        menu: true,
        canGoBack: false,
        color: null,
      },
    });
    dispatch({
      type: Actions.SEARCH_STATE,
      state: {
        placeholder: 'Search all notebooks',
        data: notebooks,
        noSearch: false,
        type: 'notebooks',
        color: null,
      },
    });

    dispatch({
      type: Actions.HEADER_VERTICAL_MENU,
      state: false,
    });
    dispatch({
      type: Actions.HEADER_TEXT_STATE,
      state: {
        heading: params.title,
      },
    });
    dispatch({type: Actions.PINNED});
    dispatch({type: Actions.NOTEBOOKS});
    dispatch({
      type: Actions.CURRENT_SCREEN,
      screen: 'notebooks',
    });
   console.log(notebooks)
  }, []);

  useEffect(() => {
    navigation.addListener('focus', onFocus);
    return () => {
      navigation.removeListener('focus', onFocus);
    };
  });

  useEffect(() => {
    if (navigation.isFocused()) {
      dispatch({
        type: Actions.SEARCH_STATE,
        state: {
          placeholder: 'Search all notebooks',
          data: notebooks,
          noSearch: false,
          type: 'notebooks',
          color: null,
        },
      });
    }
  }, [notebooks]);

  useEffect(() => {
    console.log('render folders');  
  })

  const _onPressBottomButton = () => AddNotebookEvent();

  return (
    <>
      <SimpleList
        data={notebooks}
        type="notebooks"
        focused={() => navigation.isFocused()}
        RenderItem={NotebookItemWrapper}
        placeholder={<Placeholder type="notebooks" />}
      />
      <ContainerBottomButton
        title="Create a new notebook"
        onPress={_onPressBottomButton}
      />
    </>
  );
};

export default Folders;
