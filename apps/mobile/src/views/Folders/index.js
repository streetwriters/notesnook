import React, {useEffect} from 'react';
import {AddNotebookEvent} from '../../components/DialogManager/recievers';
import {Placeholder} from '../../components/ListPlaceholders';
import SimpleList from '../../components/SimpleList';
import {NotebookItemWrapper} from '../../components/SimpleList/NotebookItemWrapper';
import {useTracked} from '../../provider';
import {ACTIONS} from '../../provider/actions';
import {ContainerBottomButton} from '../../components/Container/ContainerBottomButton';
export const Folders = ({route, navigation}) => {
  const [state, dispatch] = useTracked();
  const {notebooks} = state;
  const params = route.params;

  const onFocus = useCallback(() => {
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
  }, [notebooks]);

  const _onPressBottomButton = () => AddNotebookEvent();

  return (
    <>
      <SimpleList
        data={notebooks}
        type="notebooks"
        focused={() => navigation.isFocused()}
        RenderItem={NotebookItemWrapper}
        placeholder={<Placeholder type="notebooks" />}
        pinned={true}
        placeholderText="Notebooks you add will appear here"
      />
      <ContainerBottomButton
        title="Create a new notebook"
        onPress={_onPressBottomButton}
      />
    </>
  );
};

export default Folders;
