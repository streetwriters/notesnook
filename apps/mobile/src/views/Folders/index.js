import {useIsFocused} from '@react-navigation/native';
import React, {useEffect} from 'react';
import {BackHandler} from 'react-native';
import Container from '../../components/Container';
import {AddNotebookEvent} from '../../components/DialogManager/recievers';
import {NotebookPlaceHolder} from '../../components/ListPlaceholders';
import {NotebookItem} from '../../components/NotebookItem';
import SelectionWrapper from '../../components/SelectionWrapper';
import SimpleList from '../../components/SimpleList';
import {useTracked} from '../../provider';
import {ACTIONS} from '../../provider/actions';
import {eSendEvent} from '../../services/eventManager';
import {eScrollEvent} from '../../services/events';
import NavigationService from '../../services/NavigationService';
import {slideRight} from '../../utils/animations';
import {w} from '../../utils/utils';
export const Folders = ({route, navigation}) => {
  const [state, dispatch] = useTracked();
  const {
    colors,
    selectionMode,
    pinned,
    notebooks,
    preventDefaultMargins,
  } = state;
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
      dispatch({type: ACTIONS.PINNED});
      dispatch({type: ACTIONS.NOTEBOOKS});
      dispatch({
        type: ACTIONS.CURRENT_SCREEN,
        screen: 'notebooks',
      });
    }
  }, [isFocused]);

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

  const _renderItem = ({item, index}) => (
    <SelectionWrapper item={item}>
      <NotebookItem
        hideMore={params.hideMore}
        navigation={navigation}
        route={route}
        customStyle={{
          width: selectionMode ? w - 74 : '100%',
          marginHorizontal: 0,
        }}
        isMove={params.isMove}
        selectionMode={selectionMode}
        onLongPress={() => {
          if (!selectionMode) {
            dispatch({
              type: ACTIONS.SELECTION_MODE,
              enabled: !selectionMode,
            });
          }

          dispatch({
            type: ACTIONS.SELECTED_ITEMS,
            item: item,
          });
        }}
        noteToMove={params.note}
        item={item}
        index={index}
      />
    </SelectionWrapper>
  );

  return (
    <Container
      bottomButtonText="Create a new notebook"
      menu={route.params.canGoBack ? false : true}
      preventDefaultMargins={preventDefaultMargins}
      heading={params.title}
      canGoBack={params.canGoBack}
      route={route}
      navigation={navigation}
      placeholder="Search all notebooks"
      data={notebooks}
      type="notebooks"
      bottomButtonOnPress={() => {
        AddNotebookEvent(null);
      }}>
      <SimpleList
        data={notebooks}
        type="notebooks"
        focused={isFocused}
        renderItem={_renderItem}
        hideMore={params.hideMore}
        isMove={params.isMove}
        noteToMove={params.note}
        placeholder={
          <>
            <NotebookPlaceHolder animation={slideRight} colors={colors} />
          </>
        }
        pinned={pinned.notebooks}
        placeholderText="Notebooks you add will appear here"
      />
    </Container>
  );
};

export default Folders;
