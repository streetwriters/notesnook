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
const w = Dimensions.get('window').width;
const h = Dimensions.get('window').height;
const AnimatedTouchableOpacity = Animatable.createAnimatableComponent(
  TouchableOpacity,
);
export const Notebook = ({navigation}) => {
  // State
  const [colors, setColors] = useState(COLOR_SCHEME);
  const params = navigation.state.params;
  const [hideHeader, setHideHeader] = useState(false);
  const [margin, setMargin] = useState(190);
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
            <>
              {params.hideMore ? (
                <View style={{marginTop: margin}} />
              ) : (
                <AnimatedTouchableOpacity
                  transition="marginTop"
                  duration={200}
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
                </AnimatedTouchableOpacity>
              )}
            </>
          }
          ListHeaderComponent={
            <View
              style={{
                marginTop: margin + 20,
                flexDirection: 'row',
                justifyContent: 'space-between',
                width:
                  numColumns === 2
                    ? DDS.isTab
                      ? w * 0.7 * 0.95
                      : w * 0.95
                    : w * 0.95,

                alignSelf: 'center',
                marginLeft:
                  numColumns === 2 ? (DDS.isTab ? w * 0.7 * 0.025 : 0) : 0,
                paddingHorizontal: ph + 5,
              }}>
              <View>
                <Text
                  transition="marginTop"
                  delay={200}
                  duration={200}
                  style={{
                    fontSize: SIZE.lg,
                    fontFamily: WEIGHT.medium,
                    color: colors.pri,
                    paddingHorizontal: DDS.isTab ? '2.5%' : '5%',
                    maxWidth: '100%',
                  }}>
                  <Text
                    style={{
                      color: colors.accent,
                    }}></Text>
                </Text>
              </View>

              <TouchableOpacity
                onPress={() => {
                  setNumColumns(numColumns === 1 ? 2 : 1);
                }}
                style={{
                  justifyContent: 'center',
                  alignItems: 'center',
                }}>
                <Icon name="list" size={SIZE.xl} color={colors.icon} />
              </TouchableOpacity>
            </View>
          }
          numColumns={numColumns}
          key={numColumns}
          columnWrapperStyle={
            numColumns === 1
              ? null
              : {
                  width:
                    params.notebook.topics.length === 1
                      ? DDS.isTab
                        ? '95%'
                        : '90%'
                      : DDS.isTab
                      ? '45%'
                      : '42.5%',
                }
          }
          contentContainerStyle={{
            width:
              numColumns === 2
                ? DDS.isTab
                  ? '100%'
                  : null
                : DDS.isTab
                ? '95%'
                : '90%',
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
              fontFamily: WEIGHT.semibold,
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
