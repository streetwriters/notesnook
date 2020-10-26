import React, {useCallback, useEffect, useState} from 'react';
import {AddTopicEvent} from '../../components/DialogManager/recievers';
import {NotebookItem} from '../../components/NotebookItem';
import SelectionWrapper from '../../components/SelectionWrapper';
import SimpleList from '../../components/SimpleList';
import {useTracked} from '../../provider';
import {Actions} from '../../provider/Actions';
import {ContainerBottomButton} from '../../components/Container/ContainerBottomButton';
import {
  eSendEvent,
  eSubscribeEvent,
  eUnSubscribeEvent,
} from '../../services/EventManager';
import {eOnNewTopicAdded, eScrollEvent, eUpdateSearchState} from '../../utils/Events';
import NavigationService from '../../services/Navigation';
import {db} from "../../utils/DB";

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

  const onFocus = () => {
    onLoad();
    dispatch({
      type: Actions.HEADER_TEXT_STATE,
      state: {
        heading: params.title,
      },
    });

    eSendEvent(eUpdateSearchState,{
      placeholder: `Search in "${params.title}"`,
      data: topics,
      noSearch: false,
      type: 'topics',
      color: null,
    })

    dispatch({
      type: Actions.CURRENT_SCREEN,
      screen: 'notebook',
    });
  }

  useEffect(() => {
    navigation.addListener('focus', onFocus);
    return () => {
      navigation.removeListener('focus', onFocus);
    };
  });

  useEffect(() => {
    if (navigation.isFocused()) {
      eSendEvent(eUpdateSearchState,{
        placeholder: `Search in "${params.title}"`,
        data: topics,
        noSearch: false,
        type: 'topics',
        color: null,
      })
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
  const {colors,selectionMode } = state;

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
            type: Actions.SELECTION_MODE,
            enabled: !selectionMode,
          });
        }
        dispatch({
          type: Actions.SELECTED_ITEMS,
          item: item,
        });
      }}
      item={item}>
      <NotebookItem
        isTopic={true}
        customStyle={{
          width: '100%',
          marginHorizontal: 0,
        }}
        selectionMode={selectionMode}
        item={item}
        index={index}
        colors={colors}
      />
    </SelectionWrapper>
  );
};
