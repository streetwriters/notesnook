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
import {AnimatedSafeAreaView} from '../Home';
import * as Animatable from 'react-native-animatable';
import {NavigationEvents} from 'react-navigation';
import {DDS} from '../../../App';
import {useAppContext} from '../../provider/useAppContext';
const w = Dimensions.get('window').width;
const h = Dimensions.get('window').height;
const AnimatedTouchableOpacity = Animatable.createAnimatableComponent(
  TouchableOpacity,
);
export const Notebook = ({navigation}) => {
  // State
  const {colors} = useAppContext();
  const params = navigation.state.params;
  const [hideHeader, setHideHeader] = useState(false);
  const [margin, setMargin] = useState(180);
  const [buttonHide, setButtonHide] = useState(false);
  const [numColumns, setNumColumns] = useState(1);
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

  // Functions
  const setMarginTop = () => {
    return;
    console.log(params.notebook);
    if (headerHeight < 30 || searchHeight < 30) {
      return;
    }
    let toAdd = h * 0.06;
    if (marginSet) return;
    let a = headerHeight + searchHeight + toAdd;
    setMargin(a);
    headerHeight = 0;
    searchHeight = 0;
    marginSet = true;
  };

  // Render
  return (
    <AnimatedSafeAreaView
      transition="backgroundColor"
      duration={300}
      style={{
        height: '100%',
        backgroundColor: colors.bg,
      }}>
      <NavigationEvents
        onDidBlur={() => {
          marginSet = false;
        }}
      />
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
        <Animatable.View
          transition="backgroundColor"
          duration={300}
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
            canGoBack={true}
          />

          <Search
            sendHeight={height => {
              searchHeight = height;
              setMarginTop();
            }}
            placeholder={`Search in ${params.title}`}
            hide={hideHeader}
          />
        </Animatable.View>

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
            <View
              style={{
                marginTop: Platform.OS == 'ios' ? 145 : 185,
              }}></View>
          }
          numColumns={numColumns}
          key={numColumns}
          contentContainerStyle={{
            width: '100%',
            alignItems: numColumns === 2 ? 'flex-start' : null,
            alignSelf: 'center',
          }}
          ListFooterComponent={
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
            justifyContent: 'flex-start',
            alignItems: 'center',
            marginBottom: 15,
            backgroundColor: colors.accent,
          }}>
          <Icon name="plus" color="white" size={SIZE.lg} />
          <Text
            style={{
              fontSize: SIZE.md,
              fontFamily: WEIGHT.regular,
              color: 'white',
            }}>
            {'  '}Add a new topic
          </Text>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </AnimatedSafeAreaView>
  );
};

Notebook.navigationOptions = {
  header: null,
};

export default Notebook;
