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
  onThemeUpdate,
  clearThemeUpdateListener,
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
import {AnimatedSafeAreaView} from '../Home';
import * as Animatable from 'react-native-animatable';
import {NavigationEvents} from 'react-navigation';
export const Folders = ({navigation}) => {
  const [colors, setColors] = useState(COLOR_SCHEME);
  const [addNotebook, setAddNotebook] = useState(false);
  const [notebooks, setNotebooks] = useState([]);
  const [hideHeader, setHideHeader] = useState(false);
  const [buttonHide, setButtonHide] = useState(false);
  const [margin, setMargin] = useState(150);
  const forceUpdate = useForceUpdate();
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

  useEffect(() => {
    onThemeUpdate(() => {
      forceUpdate();
    });
    return () => {
      clearThemeUpdateListener(() => {
        forceUpdate();
      });
    };
  }, []);

  return (
    <AnimatedSafeAreaView
      transition="backgroundColor"
      duration={1000}
      style={{
        height: '100%',
        backgroundColor: colors.bg,
      }}>
      <NavigationEvents
        onDidBlur={() => {
          marginSet = false;
        }}
      />
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
        <Animatable.View
          transition="backgroundColor"
          duration={1000}
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
        </Animatable.View>

        <FlatList
          style={{
            width: '100%',
          }}
          onScroll={event => {
            y = event.nativeEvent.contentOffset.y;
            if (y < 30) setHideHeader(false);
            if (buttonHide) return;
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
              isMove={params.isMove}
              noteToMove={params.note}
              item={item}
              refresh={() => setNotebooks(storage.getNotebooks())}
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
            borderRadius: 5,
            width: '90%',
            marginHorizontal: '5%',
            paddingHorizontal: ph,

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
            <Icon name="plus" color="white" size={SIZE.lg} />
            {'  '} Create a new notebook
          </Text>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </AnimatedSafeAreaView>
  );
};

Folders.navigationOptions = {
  header: null,
};

export default Folders;
