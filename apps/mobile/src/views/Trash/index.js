import React, {useEffect, useState} from 'react';
import {
  Text,
  TouchableOpacity,
  SafeAreaView,
  FlatList,
  View,
} from 'react-native';
import {SIZE, ph, pv, opacity, WEIGHT} from '../../common/common';
import Icon from 'react-native-vector-icons/Feather';
import {Header} from '../../components/header';
import NoteItem from '../../components/NoteItem';
import {useAppContext} from '../../provider/useAppContext';
import {db} from '../../../App';
import {NotebookItem} from '../../components/NotebookItem';
import {Dialog} from '../../components/Dialog';
import {ToastEvent, w} from '../../utils/utils';
import {TrashPlaceHolder} from '../../components/ListPlaceholders';
import Container from '../../components/Container';
import SelectionHeader from '../../components/SelectionHeader';

export const Trash = ({navigation}) => {
  const {
    colors,
    trash,
    updateDB,
    selectionMode,
    changeSelectionMode,
    updateSelectionList,
  } = useAppContext();

  const [dialog, setDialog] = useState(false);

  return (
    <Container
      bottomButtonOnPress={() => {
        setDialog(true);
      }}
      bottomButtonText="Clear all trash">
      <SelectionHeader />
      {selectionMode ? null : (
        <Header colors={colors} heading="Trash" canGoBack={false} menu={true} />
      )}

      <FlatList
        keyExtractor={item => item.dateCreated.toString()}
        style={{
          width: '100%',
          alignSelf: 'center',
          height: '100%',
        }}
        contentContainerStyle={{
          height: '100%',
        }}
        data={trash}
        ListEmptyComponent={
          <View
            style={{
              height: '80%',
              width: '100%',
              alignItems: 'center',
              alignSelf: 'center',
              justifyContent: 'center',
              opacity: 0.8,
            }}>
            <TrashPlaceHolder colors={colors} />
            <Text
              style={{
                color: colors.icon,
                fontSize: SIZE.md,
                fontFamily: WEIGHT.regular,
                marginTop: 20,
              }}>
              Deleted notes & notebooks appear here.
            </Text>
            <Text
              style={{
                fontSize: SIZE.sm,
                color: colors.icon,
                marginTop: 20,
              }}>
              Trash is empty
            </Text>
          </View>
        }
        renderItem={({item, index}) => (
          <SelectionWrapper item={item}>
            {item.type === 'note' ? (
              <NoteItem
                customStyle={{
                  width: selectionMode ? w - 74 : '100%',
                  marginHorizontal: 0,
                }}
                onLongPress={() => {
                  if (!selectionMode) {
                    updateSelectionList(item);
                  }

                  changeSelectionMode(!selectionMode);
                }}
                item={item}
                index={index}
                isTrash={true}
              />
            ) : (
              <NotebookItem
                onLongPress={() => {
                  if (!selectionMode) {
                    updateSelectionList(item);
                  }

                  changeSelectionMode(!selectionMode);
                }}
                customStyle={{
                  width: selectionMode ? w - 74 : '100%',
                  marginHorizontal: 0,
                }}
                item={item}
                isTrash={true}
                index={index}
              />
            )}
          </SelectionWrapper>
        )}
      />

      <Dialog
        title="Empty Trash"
        visible={dialog}
        close={() => {
          setDialog(false);
        }}
        icon="trash"
        paragraph="Clearing all trash cannot be undone."
        positiveText="Clear"
        negativeText="Cancel"
        positivePress={async () => {
          await db.clearTrash();
          updateDB();
          ToastEvent.show('Trash cleared', 'success', 1000, () => {}, '');
          setDialog(false);
        }}
        negativePress={() => {
          setDialog(false);
        }}
      />
    </Container>
  );
};

Trash.navigationOptions = {
  header: null,
};

export default Trash;
