import React, {useEffect, useState} from 'react';
import {ContainerBottomButton} from '../../components/Container/ContainerBottomButton';
import {AddTopicEvent} from '../../components/DialogManager/recievers';
import SimpleList from '../../components/SimpleList';
import {useTracked} from '../../provider';
import {Actions} from '../../provider/Actions';
import {
  eSendEvent,
  eSubscribeEvent,
  eUnSubscribeEvent,
} from '../../services/EventManager';
import SearchService from '../../services/SearchService';
import {db} from '../../utils/DB';
import {eOnNewTopicAdded, eScrollEvent} from '../../utils/Events';

export const Notebook = ({route, navigation}) => {
  const [, dispatch] = useTracked();
  const [topics, setTopics] = useState(route.params.notebook.topics);
  let params = route.params;

  const onLoad = () => {
    setTopics(db.notebooks.notebook(route.params.notebook.id).data.topics);
  };

  useEffect(() => {
    onFocus();
  }, [route.params]);

  useEffect(() => {
    eSubscribeEvent(eOnNewTopicAdded, onLoad);
    return () => {
      eUnSubscribeEvent(eOnNewTopicAdded, onLoad);
    };
  }, []);

  const onFocus = () => {
    eSendEvent(eScrollEvent, {name: params.title, type: 'in'});
    onLoad();
    dispatch({
      type: Actions.HEADER_TEXT_STATE,
      state: {
        heading: params.title,
        id:params.notebook.id
      },
    });

    updateSearch();
    dispatch({
      type: Actions.CONTAINER_BOTTOM_BUTTON,
      state: {
        onPress: _onPressBottomButton,
      },
    });

    dispatch({
      type: Actions.CURRENT_SCREEN,
      screen: 'notebook',
    });
  };

  useEffect(() => {
    navigation.addListener('focus', onFocus);

    return () => {
      eSendEvent(eScrollEvent, {name: params.title, type: 'back'});
      navigation.removeListener('focus', onFocus);
    };
  }, []);
  useEffect(() => {
    if (navigation.isFocused()) {
      updateSearch();
    }
  }, [topics]);

  const updateSearch = () => {
    SearchService.update({
      placeholder: `Search in "${params.title}"`,
      data: topics,
      type: 'topics',
    });
  };

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
        placeholderData={{
          heading: route.params.notebook.title,
          paragraph: 'You have not added any topics yet.',
          button: 'Add a Topic',
          action: _onPressBottomButton,
        }}
      />

      <ContainerBottomButton
        title="Add new topic"
        onPress={_onPressBottomButton}
      />
    </>
  );
};

export default Notebook;
/* 
const RenderItem = ({item, index}) => {
  const [state, dispatch] = useTracked();
  const {colors,selectionMode } = state;

  return (
    <SelectionWrapper
      onPress={() => {
        NavigationService.navigate('NotesPage', {
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
 */
