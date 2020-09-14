import {useIsFocused} from '@react-navigation/native';
import React, {useEffect, useState} from 'react';
import {AddTopicEvent} from '../../components/DialogManager/recievers';
import {NotebookItem} from '../../components/NotebookItem';
import SelectionWrapper from '../../components/SelectionWrapper';
import SimpleList from '../../components/SimpleList';
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
import NavigationService from '../../services/NavigationService';
import {db, ToastEvent, w} from '../../utils/utils';

export const Notebook = ({route, navigation}) => {
  const [state, dispatch] = useTracked();
  const [topics, setTopics] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  let params = route.params;
  let isFocused = useIsFocused();

  const onLoad = () => {
    let allTopics;
    allTopics = db.notebooks.notebook(route.params.notebook.id).data.topics;
    setTopics(allTopics);
  };

  useEffect(() => {
    eSendEvent(eScrollEvent, 0);
    params = route.params;
    setTopics([...params.notebook.topics]);
  }, []);

  useEffect(() => {
    eSubscribeEvent(eOnNewTopicAdded, onLoad);
    return () => {
      eUnSubscribeEvent(eOnNewTopicAdded, onLoad);
    };
  }, []);

  useEffect(() => {
    if (isFocused) {
      onLoad();
      dispatch({
        type: ACTIONS.HEADER_STATE,
        state: {
          type: 'topics',
          menu: false,
          canGoBack: true,
          heading: params.title,
          route: route,
          color: null,
          navigation: navigation,
        },
      });
      dispatch({
        type: ACTIONS.CONTAINER_BOTTOM_BUTTON,
        state: {
          visible: true,
          bottomButtonOnPress: () => {
            let n = route.params.notebook;
            AddTopicEvent(n);
          },
          color: null,
          bottomButtonText: 'Add new topic',
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

      dispatch({
        type: ACTIONS.CURRENT_SCREEN,
        screen: 'notebook',
      });
    }
  }, [isFocused]);

  useEffect(() => {
    if (isFocused) {
      dispatch({
        type: ACTIONS.SEARCH_STATE,
        state: {
          placeholder: `Search in "${params.title}"`,
          data: topics,
          noSearch: false,
          type: 'topics',
          color: null,
        },
      });
    }
  }, [topics, isFocused]);

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
    <SimpleList
      data={topics}
      type="topics"
      customRefreshing={refreshing}
      focused={isFocused}
      customRefresh={_onRefresh}
      RenderItem={RenderItem}
      placeholder={<></>}
      placeholderText=""
    />
  );
};

export default Notebook;

const RenderItem = ({item, index}) => {
  const [state, dispatch] = useTracked();
  const {colors, selectionMode, preventDefaultMargins} = state;
  let headerState = preventDefaultMargins
    ? state.indHeaderState
    : state.headerState;
  let params = headerState.route.params ? headerState.route.params : {};

  return (
    <SelectionWrapper
      onPress={() => {
        NavigationService.navigate('Notes', {
          ...item,
        });
      }}
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
      item={item}>
      <NotebookItem
        hideMore={preventDefaultMargins}
        isTopic={true}
        customStyle={{
          width: '100%',
          marginHorizontal: 0,
        }}
        selectionMode={selectionMode}
        noteToMove={params.note}
        notebookID={params.notebook?.id}
        isMove={preventDefaultMargins}
        item={item}
        index={index}
        colors={colors}
        data={params.notebook?.topics}
      />
    </SelectionWrapper>
  );
};
