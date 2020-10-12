import React, {useCallback, useEffect, useState} from 'react';
import {AddTopicEvent} from '../../components/DialogManager/recievers';
import {NotebookItem} from '../../components/NotebookItem';
import SelectionWrapper from '../../components/SelectionWrapper';
import SimpleList from '../../components/SimpleList';
import {useTracked} from '../../provider';
import {ACTIONS} from '../../provider/actions';
import {ContainerBottomButton} from '../../components/Container/ContainerBottomButton';
import {
  eSendEvent,
  eSubscribeEvent,
  eUnSubscribeEvent,
} from '../../services/eventManager';
import {eOnNewTopicAdded, eScrollEvent} from '../../services/events';
import NavigationService from '../../services/NavigationService';
import {db} from '../../utils/utils';
import { Dimensions } from 'react-native';

export const Notebook = ({route, navigation}) => {
  const [, dispatch] = useTracked();
  const [topics, setTopics] = useState([]);
  let params = route.params;

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

  const onFocus = useCallback(() => {
    onLoad();
    dispatch({
      type: ACTIONS.HEADER_STATE,
      state: {
        type: 'topics',
        menu: false,
        canGoBack: true,
        heading: params.title,
        color: null,
      },
    });
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
          placeholder: `Search in "${params.title}"`,
          data: topics,
          noSearch: false,
          type: 'topics',
          color: null,
        },
      });
    }
  }, [topics]);

  const _onPressBottomButton = () => {
    let n = route.params.notebook;
    AddTopicEvent(n);
  
  };

  return (
    <>
      <SimpleList
        data={topics}
        type="topics"
        refreshCallback={() => {
          onLoad();
        }}
        focused={() => navigation.isFocused()}
        RenderItem={RenderItem}
        placeholder={<></>}
        placeholderText=""
      />

      <ContainerBottomButton
        title="Add new topic"
        onPress={_onPressBottomButton}
      />
    </>
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
