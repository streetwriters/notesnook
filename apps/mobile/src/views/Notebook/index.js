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
import {eMoveNoteDialogNavigateBack, eScrollEvent} from '../../services/events';

export const Notebook = ({navigation}) => {
  const [state, dispatch] = useTracked();
  const {colors, selectionMode, preventDefaultMargins} = state;
  const [topics, setTopics] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  let params = navigation.state.params;

  let isFocused = useIsFocused();

  useEffect(() => {
    let topic = params.notebook.topics;

    setTopics([...topic]);
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
    <NotebookItem
      hideMore={params.hideMore}
      isTopic={true}
      noteToMove={params.note}
      notebookID={params.notebook.dateCreated}
      isMove={params.isMove}
      refresh={() => {}}
      item={item}
      index={index}
      colors={colors}
      data={topics}
    />
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
      bottomButtonText="Add new topic"
      preventDefaultMargins={preventDefaultMargins}
      navigation={navigation}
      placeholder={`Search in ${params.title}`}
      heading={params.title}
      canGoBack={true}
      data={params.notebook.topics}
      bottomButtonOnPress={() => {
        //setAddTopic(true);
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
