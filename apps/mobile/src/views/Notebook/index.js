import React, {useEffect} from 'react';
import {FlatList, Platform, Text, View} from 'react-native';
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

  const params = navigation.state.params;

  let isFocused = useIsFocused();

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
      data={params.notebooks.topics}
    />
  );

  ListFooterComponent = (
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

  ListHeaderComponent = (
    <View
      style={{
        marginTop:
          Platform.OS == 'ios'
            ? params.notebook.topics[0] && !selectionMode
              ? 135
              : 135 - 60
            : params.notebook.topics[0] && !selectionMode
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
      bottomButtonOnPress={() => {
        //setAddTopic(true);
      }}>
      <FlatList
        style={{
          width: '100%',
        }}
        data={params.notebook.topics}
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
