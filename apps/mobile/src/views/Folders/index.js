import React, {useEffect, useState} from 'react';
import {
  BackHandler,
  FlatList,
  Platform,
  Text,
  View,
  RefreshControl,
} from 'react-native';
import {useIsFocused} from 'react-navigation-hooks';
import {DDS} from '../../../App';
import {SIZE, WEIGHT} from '../../common/common';
import Container from '../../components/Container';
import {AddNotebookEvent} from '../../components/DialogManager';
import {NotebookPlaceHolder} from '../../components/ListPlaceholders';
import {NotebookItem} from '../../components/NotebookItem';
import SelectionWrapper from '../../components/SelectionWrapper';
import {useTracked} from '../../provider';
import {ACTIONS} from '../../provider/actions';
import {eSendEvent} from '../../services/eventManager';
import {eScrollEvent} from '../../services/events';
import {slideLeft, slideRight} from '../../utils/animations';
import {w, ToastEvent, hexToRGBA} from '../../utils/utils';
import {inputRef} from '../../components/SearchInput';
import SimpleList from '../../components/SimpleList';

export const Folders = ({navigation}) => {
  const [state, dispatch] = useTracked();
  const {
    colors,
    selectionMode,
    pinned,
    notebooks,
    preventDefaultMargins,
  } = state;
  const searchResults = {...state.searchResults};

  const [refreshing, setRefreshing] = useState(false);
  let isFocused = useIsFocused();

  const handleBackPress = () => {
    alert('here');
    return true;
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

  const _onRefresh = async () => {
    setRefreshing(true);
    try {
      await db.sync();
      dispatch({type: ACTIONS.NOTEBOOKS});
      dispatch({type: ACTIONS.PINNED});
      dispatch({type: ACTIONS.USER});
      setRefreshing(false);
      ToastEvent.show('Sync Complete', 'success');
    } catch (e) {
      setRefreshing(false);
      ToastEvent.show('Sync failed, network error', 'error');
    }
  };

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
        refreshing={refreshing}
        focused={isFocused}
        onRefresh={_onRefresh}
        renderItem={_renderItem}
        placeholder={
          <>
            <NotebookPlaceHolder animation={slideRight} colors={colors} />
            <NotebookPlaceHolder animation={slideLeft} colors={colors} />
            <NotebookPlaceHolder animation={slideRight} colors={colors} />
          </>
        }
        pinned={pinned}
        placeholderText="Notebooks you add will appear here"
      />
    </Container>
  );
};

Folders.navigationOptions = {
  header: null,
};

export default Folders;
