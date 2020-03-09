import React, {useEffect, useState} from 'react';
import {useIsFocused} from 'react-navigation-hooks';
import {db} from '../../../App';
import Container from '../../components/Container';
import {AddTopicEvent} from '../../components/DialogManager';
import {NotebookItem} from '../../components/NotebookItem';
import SelectionWrapper from '../../components/SelectionWrapper';
import {useTracked} from '../../provider';
import {ACTIONS} from '../../provider/actions';
import {
  eSendEvent,
  eSubscribeEvent,
  eUnSubscribeEvent,
} from '../../services/eventManager';
import {
  eMoveNoteDialogNavigateBack,
  eOnNewTopicAdded,
  eScrollEvent,
} from '../../services/events';
import {ToastEvent, w} from '../../utils/utils';
import SimpleList from '../../components/SimpleList';
import {NotebookPlaceHolder} from '../../components/ListPlaceholders';

export const Notebook = ({navigation}) => {
  const [state, dispatch] = useTracked();
  const {colors, selectionMode, preventDefaultMargins} = state;
  const [topics, setTopics] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  let params = navigation.state.params;
  let notebook;
  let isFocused = useIsFocused();

  const onLoad = () => {
    let allTopics;

    allTopics = db.notebooks.notebook(navigation.state.params.notebook.id).data
      .topics;

    notebook = db.notebooks.notebook(navigation.state.params.notebook.id);

    setTopics(allTopics);
  };

  useEffect(() => {
    eSendEvent(eScrollEvent, 0);
    params = navigation.state.params;
    let topic = params.notebook.topics;
    notebook = params.notebook;
    setTopics([...topic]);
  }, []);

  useEffect(() => {
    eSubscribeEvent(eOnNewTopicAdded, onLoad);
    return () => {
      eUnSubscribeEvent(eOnNewTopicAdded, onLoad);
    };
  }, []);

  const handleBackPress = () => {
    navigation.goBack();
  };

  useEffect(() => {
    if (isFocused) {
      dispatch({
        type: ACTIONS.CURRENT_SCREEN,
        screen: 'notebook',
      });
      onLoad();
    }
  }, [isFocused]);
  useEffect(() => {
    eSubscribeEvent(eMoveNoteDialogNavigateBack, handleBackPress);
    return () => {
      eUnSubscribeEvent(eMoveNoteDialogNavigateBack, handleBackPress);
    };
  }, []);

  const _renderItem = ({item, index}) => (
    <SelectionWrapper item={item}>
      <NotebookItem
        hideMore={params.hideMore}
        isTopic={true}
        customStyle={{
          width: selectionMode ? w - 74 : '100%',
          marginHorizontal: 0,
        }}
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
        notebookID={params.notebook.id}
        isMove={params.isMove}
        refresh={() => {}}
        item={item}
        index={index}
        colors={colors}
        data={topics}
      />
    </SelectionWrapper>
  );

  const _onRefresh = async () => {
    setRefreshing(true);
    try {
      await db.sync();

      onLoad();
      dispatch({type: ACTIONS.USER});
      setRefreshing(false);
      ToastEvent.show('Sync Complete', 'success');
    } catch (e) {
      setRefreshing(false);
      ToastEvent.show('Sync failed, network error', 'error');
    }
  };

  return (
    <Container
      bottomButtonText="Create a new topic"
      preventDefaultMargins={preventDefaultMargins}
      navigation={navigation}
      placeholder={`Search in "${params.title}"`}
      heading={params.title}
      canGoBack={true}
      type="topics"
      data={topics}
      bottomButtonOnPress={() => {
        let n = navigation.state.params.notebook;
        AddTopicEvent(n);
      }}>
      <SimpleList
        data={topics}
        type="topics"
        refreshing={refreshing}
        focused={isFocused}
        onRefresh={_onRefresh}
        renderItem={_renderItem}
        placeholder={<NotebookPlaceHolder colors={colors} />}
        placeholderText="Topics added to notebook appear here."
      />
    </Container>
  );
};

Notebook.navigationOptions = {
  header: null,
};

export default Notebook;
