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
  FlatList,
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
import {Header} from '../../components/header';
import NoteItem from '../../components/NoteItem';
import {NotebookItem} from '../../components/NotebookItem';
import {Search} from '../../components/SearchInput';
import {useForceUpdate} from '../ListsEditor';
import {AddTopicDialog} from '../../components/AddTopicDialog';

const w = Dimensions.get('window').width;
const h = Dimensions.get('window').height;

export const Notebook = ({navigation}) => {
  // State
  const [colors, setColors] = useState(COLOR_SCHEME);
  const params = navigation.state.params;
  const [hideHeader, setHideHeader] = useState(false);
  const [margin, setMargin] = useState(150);
  const [buttonHide, setButtonHide] = useState(false);
  const [addTopic, setAddTopic] = useState(false);
  const forceUpdate = useForceUpdate();
  // Variables
  let offsetY = 0;
  let countUp = 0;
  let countDown = 0;
  let headerHeight = 0;
  let searchHeight = 0;
  let marginSet = false;

  // Effects
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

  // Functions
  const setMarginTop = () => {
    if (margin !== 150) return;
    if (headerHeight == 0 || searchHeight == 0) {
      let toAdd = h * 0.06;

      setTimeout(() => {
        if (marginSet) return;
        setMargin(headerHeight + searchHeight + toAdd);
        headerHeight = 0;
        searchHeight = 0;
        marginSet = true;
      }, 50);
    }
  };

  // Render
  return (
    <SafeAreaView
      style={{
        height: '100%',
        backgroundColor: colors.bg,
      }}>
      <KeyboardAvoidingView
        style={{
          height: '100%',
        }}>
        <AddTopicDialog
          visible={addTopic}
          notebookID={params.notebook.dateCreated}
          close={() => {
            setAddTopic(false);
          }}
        />
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
            placeholder={`Search in ${params.title}`}
            hide={hideHeader}
          />
        </View>

        <FlatList
          style={{
            width: '100%',
          }}
          data={params.notebook.topics}
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
            <>
              {params.hideMore ? (
                <View style={{marginTop: margin}} />
              ) : (
                <TouchableOpacity
                  activeOpacity={opacity}
                  onPress={() => {
                    setAddNotebook(true);
                  }}
                  style={{
                    borderWidth: 1,
                    borderRadius: 5,
                    marginTop: margin,
                    width: '90%',
                    marginHorizontal: '5%',
                    paddingHorizontal: ph,
                    borderColor: colors.nav,
                    paddingVertical: pv + 5,
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 15,
                  }}>
                  <Text
                    style={{
                      fontSize: SIZE.md,
                      fontFamily: WEIGHT.bold,
                      color: colors.pri,
                    }}>
                    View All Notes
                  </Text>
                </TouchableOpacity>
              )}
            </>
          }
          renderItem={({item, index}) => (
            <NotebookItem
              hideMore={params.hideMore}
              isTopic={true}
              noteToMove={params.note}
              notebookID={params.notebook.dateCreated}
              isMove={params.isMove}
              refresh={() => {
                forceUpdate();
              }}
              item={item}
              index={index}
              colors={colors}
            />
          )}
        />
        <TouchableOpacity
          activeOpacity={opacity}
          onPress={() => {
            setAddTopic(true);
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
            {'  '}Add a new topic
          </Text>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

Notebook.navigationOptions = {
  header: null,
};

export default Notebook;
