import React, {useEffect, useState} from 'react';
import {BackHandler} from 'react-native';
import {useIsFocused} from 'react-navigation-hooks';
import Container from '../../components/Container';
import {NotebookPlaceHolder} from '../../components/ListPlaceholders';
import {NotebookItem} from '../../components/NotebookItem';
import SelectionWrapper from '../../components/SelectionWrapper';
import SimpleList from '../../components/SimpleList';
import {useTracked} from '../../provider';
import {ACTIONS} from '../../provider/actions';
import {eSendEvent} from '../../services/eventManager';
import {eScrollEvent} from '../../services/events';
import {slideLeft, slideRight} from '../../utils/animations';
import {ToastEvent, w, db} from '../../utils/utils';
import {AddNotebookEvent} from '../../components/DialogManager/recievers';
import NavigationService from '../../services/NavigationService';

export const Folders = ({navigation}) => {
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
    if (navigation.state.params.isMove) {
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

  const params = navigation.state.params;

  const _renderItem = ({item, index}) => (
    <SelectionWrapper item={item}>
      <NotebookItem
        hideMore={params.hideMore}
        navigation={navigation}
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
      menu={params.canGoBack ? false : true}
      preventDefaultMargins={preventDefaultMargins}
      heading={params.title}
      canGoBack={params.canGoBack}
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

Folders.navigationOptions = {
  header: null,
};

export default Folders;
