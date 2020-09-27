import {useIsFocused} from '@react-navigation/native';
import React, {useEffect} from 'react';
import {AddNotebookEvent} from '../../components/DialogManager/recievers';
import {Placeholder} from '../../components/ListPlaceholders';
import SimpleList from '../../components/SimpleList';
import {NotebookItemWrapper} from '../../components/SimpleList/NotebookItemWrapper';
import {useTracked} from '../../provider';
import {ACTIONS} from '../../provider/actions';
export const Folders = ({route, navigation}) => {
  const [state, dispatch] = useTracked();
  const {notebooks} = state;
  let isFocused = useIsFocused();

  useEffect(() => {
    if (isFocused) {
      dispatch({
        type: ACTIONS.HEADER_STATE,
        state: {
          type: 'notebooks',
          menu: true,
          canGoBack: false,
          color: null,
        },
      });
      dispatch({
        type: ACTIONS.CONTAINER_BOTTOM_BUTTON,
        state: {
          bottomButtonText: 'Create a new notebook',
          bottomButtonOnPress: () => AddNotebookEvent(),
          color: null,
          visible: true,
        },
      });
      dispatch({
        type: ACTIONS.HEADER_VERTICAL_MENU,
        state: false,
      });
      dispatch({
        type: ACTIONS.HEADER_TEXT_STATE,
        state: {
          heading: params.title,
        },
      });
      dispatch({type: ACTIONS.PINNED});
      dispatch({type: ACTIONS.NOTEBOOKS});
      dispatch({
        type: ACTIONS.CURRENT_SCREEN,
        screen: 'notebooks',
      });
    }
  }, [isFocused]);

  useEffect(() => {
    if (isFocused) {
      dispatch({
        type: ACTIONS.SEARCH_STATE,
        state: {
          placeholder: 'Search all notebooks',
          data: notebooks,
          noSearch: false,
          type: 'notebooks',
          color: null,
        },
      });
    }
  }, [notebooks, isFocused]);

  const params = route.params;

  return (
    <SimpleList
      data={notebooks}
      type="notebooks"
      focused={isFocused}
      RenderItem={NotebookItemWrapper}
      placeholder={<Placeholder type="notebooks" />}
      pinned={true}
      placeholderText="Notebooks you add will appear here"
    />
  );
};

export default Folders;
