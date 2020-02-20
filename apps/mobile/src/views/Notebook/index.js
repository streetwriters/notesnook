import React, {useEffect, useState} from 'react';
import {FlatList, Platform, RefreshControl, Text, View} from 'react-native';
import {useIsFocused} from 'react-navigation-hooks';
import {db} from '../../../App';
import {SIZE, WEIGHT} from '../../common/common';
import Container from '../../components/Container';
import {AddTopicEvent} from '../../components/DialogManager';
import {NotebookItem} from '../../components/NotebookItem';
import SelectionWrapper from '../../components/SelectionWrapper';
import {useTracked} from '../../provider';
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
import {ACTIONS} from '../../provider/actions';

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
    console.log(allTopics);

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
    }

    eSubscribeEvent(eMoveNoteDialogNavigateBack, handleBackPress);
    return () => {
      eUnSubscribeEvent(eMoveNoteDialogNavigateBack, handleBackPress);
    };
  }, [isFocused]);

  const onScroll = event => {
    let y = event.nativeEvent.contentOffset.y;
    eSendEvent(eScrollEvent, y);
  };

  const keyExtractor = (item, index) =>
    item.dateCreated.toString() + index.toString();

  const renderItem = ({item, index}) => (
    <SelectionWrapper item={item}>
      <NotebookItem
        hideMore={params.hideMore}
        isTopic={true}
        customStyle={{
          width: selectionMode ? w - 74 : '100%',
          marginHorizontal: 0,
        }}
        onLongPress={() => {
          dispatch({
            type: ACTIONS.SELECTION_MODE,
            enabled: !selectionMode,
          });
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

  const ListFooterComponent = (
    <View
      style={{
        height: 150,
        alignItems: 'center',
        justifyContent: 'center',
      }}>
      <Text
        style={{
          color: colors.navbg,
          fontSize: SIZE.sm,
          fontFamily: WEIGHT.regular,
        }}>
        - End -
      </Text>
    </View>
  );

  const ListHeaderComponent = (
    <View
      style={{
        marginTop:
          Platform.OS == 'ios'
            ? topics[0] && !selectionMode
              ? 135
              : 135 - 60
            : topics[0] && !selectionMode
            ? 155
            : 155 - 60,
      }}
    />
  );

  return (
    <Container
      bottomButtonText="Create a new topic"
      preventDefaultMargins={preventDefaultMargins}
      navigation={navigation}
      placeholder={`Search in "${params.title}"`}
      heading={params.title}
      canGoBack={true}
      data={topics}
      bottomButtonOnPress={() => {
        let n = navigation.state.params.notebook;
        AddTopicEvent(n);
      }}>
      <FlatList
        refreshControl={
          <RefreshControl
            tintColor={colors.accent}
            colors={[colors.accent]}
            progressViewOffset={165}
            onRefresh={async () => {
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
            }}
            refreshing={refreshing}
          />
        }
        style={{
          width: '100%',
        }}
        data={topics}
        onScroll={onScroll}
        ListHeaderComponent={ListHeaderComponent}
        ListFooterComponent={ListFooterComponent}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
      />
    </Container>
  );
};

Notebook.navigationOptions = {
  header: null,
};

export default Notebook;
