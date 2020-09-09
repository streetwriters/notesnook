import {useIsFocused} from '@react-navigation/native';
import React, {useEffect} from 'react';
import {BackHandler} from 'react-native';
import {AddNotebookEvent} from '../../components/DialogManager/recievers';
import SimpleList from '../../components/SimpleList';
import {NotebookItemWrapper} from '../../components/SimpleList/NotebookItemWrapper';
import {useTracked} from '../../provider';
import {ACTIONS} from '../../provider/actions';
import {eSendEvent} from '../../services/eventManager';
import {eScrollEvent} from '../../services/events';
import NavigationService from '../../services/NavigationService';
import { Placeholder } from '../../components/ListPlaceholders';
export const Folders = ({route, navigation}) => {
  const [state, dispatch] = useTracked();
  const {notebooks} = state;
  let isFocused = useIsFocused();

  const handleBackPress = () => {
    if (route.params.isMove) {
      return true;
    } else {
      NavigationService.goBack();
      return true;
    }
  };

  useEffect(() => {
    if (isFocused) {
      dispatch({
        type: ACTIONS.HEADER_STATE,
        state: {
          type: 'notebooks',
          menu: !params.canGoBack,
          canGoBack: params.canGoBack,
          route: route,
          color: null,
          navigation: navigation,
          ind:!params.root
        },
      });
      dispatch({
        type: ACTIONS.CONTAINER_BOTTOM_BUTTON,
        state: {
          bottomButtonText: 'Create a new notebook',
          bottomButtonOnPress: () => AddNotebookEvent(),
          color: null,
          visible: true,
          ind:!params.root
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
          ind:!params.root
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
          placeholder:params.root? 'Search all notebooks' : 'Select a notebook',
          data: notebooks,
          noSearch: false,
          type: 'notebooks',
          color: null,
          ind:!params.root
        },
      });
    }
  }, [notebooks, isFocused]);

  useEffect(() => {
    eSendEvent(eScrollEvent, 0);
    let backhandler;

    backhandler = BackHandler.addEventListener(
      'hardwareBackPress',
      handleBackPress,
    );

    return () => {
      if (!backhandler) return;
      backhandler.remove();
      backhandler = null;
    };
  }, []);

  const params = route.params;

  return (
    <SimpleList
      data={notebooks}
      type="notebooks"
      focused={isFocused}
      RenderItem={NotebookItemWrapper}
      hideMore={params.hideMore}
      isMove={params.isMove}
      noteToMove={params.note}
      placeholder={<Placeholder type="notebooks" />}
      pinned={true}
      placeholderText="Notebooks you add will appear here"
    />
  );
};

export default Folders;
