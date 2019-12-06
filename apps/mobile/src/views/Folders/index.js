import React, {useEffect, useState} from 'react';
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  Dimensions,
  Image,
  SafeAreaView,
  Platform,
  Modal,
  KeyboardAvoidingView,
} from 'react-native';
import NavigationService from '../../services/NavigationService';
import {
  COLOR_SCHEME,
  SIZE,
  br,
  ph,
  pv,
  opacity,
  FONT,
  WEIGHT,
} from '../../common/common';
import Icon from 'react-native-vector-icons/Feather';
import {Reminder} from '../../components/Reminder';
import {ListItem} from '../../components/ListItem';
import {getElevation, h, w, timeSince} from '../../utils/utils';
import {FlatList, TextInput} from 'react-native-gesture-handler';
import {useForceUpdate} from '../ListsEditor';
import {AddNotebookDialog} from '../../components/AddNotebookDialog';
import {NotebookItem} from '../../components/NotebookItem';
import {Search} from '../../components/SearchInput';
import {storage} from '../../../App';
import {Header} from '../../components/header';

export const Folders = ({navigation}) => {
  const [colors, setColors] = useState(COLOR_SCHEME);
  const [addNotebook, setAddNotebook] = useState(false);
  const [notebooks, setNotebooks] = useState([]);
  const [hideHeader, setHideHeader] = useState(false);
  const [margin, setMargin] = useState(150);
  const params = navigation.state.params;
  let offsetY = 0;
  let countUp = 0;
  let countDown = 0;
  let headerHeight = 0;
  let searchHeight = 0;

  const setMarginTop = () => {
    if (margin !== 150) return;
    if (headerHeight == 0 || searchHeight == 0) {
      let toAdd = h * 0.06;

      setTimeout(() => {
        if (margin > headerHeight + searchHeight + toAdd) return;
        setMargin(headerHeight + searchHeight + toAdd);
        headerHeight = 0;
        searchHeight = 0;
      }, 10);
    }
  };

  useEffect(() => {
    setNotebooks(storage.getNotebooks());
    console.log(storage.getNotebooks());
  }, []);

  return (
    <SafeAreaView
      style={{
        height: '100%',
      }}>
      <AddNotebookDialog
        visible={addNotebook}
        close={newNotes => {
          setAddNotebook(false);
          if (newNotes) {
            setNotebooks(storage.getNotebooks());
          }
        }}
      />
      <KeyboardAvoidingView
        style={{
          height: '100%',
        }}>
        <View
          style={{
            position: 'absolute',
            backgroundColor: colors.bg,
            zIndex: 10,
            width: '100%',
          }}>
          <Header
            sendHeight={height => (headerHeight = height)}
            hide={hideHeader}
            showSearch={() => {
              setHideHeader(false);
              countUp = 0;
              countDown = 0;
            }}
            colors={colors}
            heading={params.title}
            canGoBack={false}
          />
          <Search
            sendHeight={height => {
              searchHeight = height;
              setMarginTop();
            }}
            placeholder="Search your notebook"
            hide={hideHeader}
          />
        </View>

        <FlatList
          style={{
            width: '100%',
          }}
          onScroll={event => {
            y = event.nativeEvent.contentOffset.y;
            if (y > offsetY) {
              if (y - offsetY < 150 || countDown > 0) return;
              countDown = 1;
              countUp = 0;
              setHideHeader(true);
            } else {
              if (offsetY - y < 150 || countUp > 0) return;
              countDown = 0;
              countUp = 1;
              setHideHeader(false);
            }
            offsetY = y;
          }}
          ListHeaderComponent={
            <View
              style={{
                marginTop: margin,
              }}
            />
          }
          data={notebooks}
          keyExtractor={(item, index) => item.dateCreated.toString()}
          renderItem={({item, index}) => (
            <NotebookItem
              hideMore={params.hideMore}
              item={item}
              index={index}
              colors={colors}
            />
          )}
        />
        <TouchableOpacity
          activeOpacity={opacity}
          onPress={() => {
            setAddNotebook(true);
          }}
          style={{
            borderWidth: 1,
            borderRadius: 5,
            width: '90%',
            marginHorizontal: '5%',
            paddingHorizontal: ph,
            borderColor: '#f0f0f0',
            paddingVertical: pv + 5,
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 15,
            backgroundColor: colors.accent,
          }}>
          <Text
            style={{
              fontSize: SIZE.md,
              fontFamily: WEIGHT.semibold,
              color: 'white',
            }}>
            Create a new notebook
          </Text>
          <Icon name="plus" color="white" size={SIZE.lg} />
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

Folders.navigationOptions = {
  header: null,
};

export default Folders;
