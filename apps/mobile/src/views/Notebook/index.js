import React, {useEffect, useState} from 'react';
import {FlatList, Platform, Text, View, RefreshControl} from 'react-native';
import {useIsFocused} from 'react-navigation-hooks';
import {SIZE, WEIGHT} from '../../common/common';
import Container from '../../components/Container';
import {NotebookItem} from '../../components/NotebookItem';
import {useTracked} from '../../provider';
import {
  eSendEvent,
  eSubscribeEvent,
  eUnSubscribeEvent,
} from '../../services/eventManager';
import {
  eMoveNoteDialogNavigateBack,
  eScrollEvent,
  eOnNewTopicAdded,
} from '../../services/events';
import SelectionHeader from '../../components/SelectionHeader';
import SelectionWrapper from '../../components/SelectionWrapper';
import {AddTopicEvent} from '../../components/DialogManager';
import {db} from '../../../App';

export const Notebook = ({navigation}) => {
  const [state, dispatch] = useTracked();
  const {colors, selectionMode, preventDefaultMargins} = state;
  const [topics, setTopics] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  let params = navigation.state.params;
  let notebook;
  let isFocused = useIsFocused();

  useEffect(() => {
    params = navigation.state.params;
    let topic = params.notebook.topics;
    notebook = params.notebook;
    console.log(navigation);
    setTopics([...topic]);
  }, []);

  useEffect(() => {
    eSubscribeEvent(eOnNewTopicAdded, () => {
      notebook = db.getNotebook(navigation.state.params.notebook.dateCreated);
      setTopics([...notebook.topics]);
    });
    return () => {
      eUnSubscribeEvent(eOnNewTopicAdded, () => {
        notebook = db.getNotebook(navigation.state.params.notebook.dateCreated);
        setTopics([...notebook.topics]);
      });
    };
  }, []);

  const handleBackPress = () => {
    navigation.goBack();
  };

  useEffect(() => {
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
        notebookID={params.notebook.dateCreated}
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
        console.log(navigation.state.params.notebook);
        let n = navigation.state.params.notebook;
        AddTopicEvent(n);
      }}>
      <FlatList
        refreshControl={
          <RefreshControl
            tintColor={colors.accent}
            colors={[colors.accent]}
            progressViewOffset={165}
            onRefresh={() => {
              setRefreshing(true);
              setTimeout(() => {
                setRefreshing(false);
              }, 1000);
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
